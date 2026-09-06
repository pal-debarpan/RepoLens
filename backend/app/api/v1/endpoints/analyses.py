import uuid
import logging
import threading
from typing import Optional

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Path, Query, status
from sqlalchemy.orm import Session

from app.core.auth import AuthenticatedUser, get_current_user_optional, get_current_user_required
from app.db.session import get_db
from app.models.analysis import Analysis, AnalysisStatus
from app.models.finding import Finding
from app.models.repository import Repository
from app.schemas.analysis import AnalysisCreate, AnalysisDetailResponse, AnalysisResponse
from app.schemas.blast_radius import BlastRadiusResponse
from app.schemas.chat import ChatRequest, ChatResponse
from app.schemas.finding import FindingFilterParams, FindingResponse
from app.schemas.graph import FileGraphResponse, GraphResponse
from app.schemas.quality import QualityResponse
from app.schemas.testing import TestingResponse
from app.services import blast_radius as blast_svc
from app.services import graph as graph_svc
from app.services import orchestrator
from app.services.demo_fixture import (
    DEMO_ANALYSIS_ID,
    DEMO_BLAST_RADIUS,
    DEMO_GRAPH,
    get_demo_analysis,
    get_demo_chat_response,
)
from app.services.gemini import chat_with_gemini

logger = logging.getLogger(__name__)
router = APIRouter()


# ─── Demo Detection ────────────────────────────────────────────────────────────

def _is_demo(analysis_id: uuid.UUID) -> bool:
    return analysis_id == DEMO_ANALYSIS_ID


def _get_analysis_or_404(db: Session, analysis_id: uuid.UUID) -> Analysis:
    analysis = db.get(Analysis, analysis_id)
    if not analysis:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Analysis not found")
    return analysis


def _get_analysis_or_demo(db: Session, analysis_id: uuid.UUID) -> Analysis | None:
    """Returns Analysis or None if it's the demo fixture."""
    if _is_demo(analysis_id):
        return None
    return _get_analysis_or_404(db, analysis_id)


# ─── POST /analyses ─────────────────────────────────────────────────────────────

@router.post(
    "",
    response_model=AnalysisResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Trigger a new analysis",
    description=(
        "Triggers a new asynchronous analysis pipeline for a repository. "
        "Any authenticated or anonymous user can analyze any public repository — "
        "repository ownership is NOT required. "
        "Authenticated analyses are linked to the user's history."
    ),
)
def create_analysis(
    body: AnalysisCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: Optional[AuthenticatedUser] = Depends(get_current_user_optional),
) -> AnalysisResponse:
    # Verify repository exists
    repo = db.get(Repository, body.repository_id)
    if not repo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Repository {body.repository_id} not found",
        )

    if not repo.workspace_path:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Repository has no workspace path — ingest the repository first",
        )

    # Create analysis record
    user_id = uuid.UUID(str(current_user.id)) if current_user else None
    analysis = Analysis(
        repository_id=body.repository_id,
        user_id=user_id,
        commit_sha=body.commit_sha or repo.latest_commit_sha,
        status=AnalysisStatus.PENDING,
    )
    db.add(analysis)
    db.commit()
    db.refresh(analysis)

    # Run pipeline in background thread (prototype-appropriate; production would use task queue)
    analysis_id = analysis.id
    workspace_path = repo.workspace_path

    def run_in_thread():
        from app.db.session import SessionLocal
        thread_db = SessionLocal()
        try:
            orchestrator.run_analysis_pipeline(thread_db, analysis_id, workspace_path, user_id)
        finally:
            thread_db.close()

    thread = threading.Thread(target=run_in_thread, daemon=True)
    thread.start()

    return AnalysisResponse.model_validate(analysis)


# ─── GET /analyses ──────────────────────────────────────────────────────────────

@router.get(
    "",
    response_model=list[AnalysisResponse],
    summary="Get authenticated user's analysis history",
    description="Returns the analysis history for the currently authenticated user. Requires authentication.",
)
def get_user_analyses(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user_required),
) -> list[AnalysisResponse]:
    user_id = uuid.UUID(str(current_user.id))
    analyses = (
        db.query(Analysis)
        .filter(Analysis.user_id == user_id)
        .order_by(Analysis.created_at.desc())
        .limit(limit)
        .offset(offset)
        .all()
    )
    return [AnalysisResponse.model_validate(a) for a in analyses]


# ─── GET /analyses/{id} ─────────────────────────────────────────────────────────

@router.get(
    "/{analysis_id}",
    response_model=AnalysisDetailResponse,
    summary="Get full analysis detail",
)
def get_analysis(
    analysis_id: uuid.UUID = Path(...),
    db: Session = Depends(get_db),
    current_user: Optional[AuthenticatedUser] = Depends(get_current_user_optional),
) -> AnalysisDetailResponse:
    if _is_demo(analysis_id):
        return get_demo_analysis()

    analysis = _get_analysis_or_404(db, analysis_id)

    # Assemble detail with nested data from JSON columns
    from app.schemas.graph import GraphResponse
    from app.schemas.quality import QualityResponse
    from app.schemas.testing import TestingResponse

    graph_data = None
    quality_data = None
    testing_data = None

    if analysis.graph_data:
        try:
            graph_data = GraphResponse.model_validate(analysis.graph_data)
        except Exception:
            pass

    if analysis.quality_details:
        try:
            quality_data = QualityResponse.model_validate(analysis.quality_details)
        except Exception:
            pass

    if analysis.testing_details:
        try:
            testing_data = TestingResponse.model_validate(analysis.testing_details)
        except Exception:
            pass

    findings = [
        FindingResponse.model_validate(f)
        for f in db.query(Finding).filter(Finding.analysis_id == analysis_id).all()
    ]

    base = AnalysisResponse.model_validate(analysis)
    return AnalysisDetailResponse(
        **base.model_dump(),
        graph=graph_data,
        quality=quality_data,
        testing=testing_data,
        findings=findings,
    )


# ─── GET /analyses/{id}/blast-radius ───────────────────────────────────────────

@router.get(
    "/{analysis_id}/blast-radius",
    response_model=BlastRadiusResponse,
    summary="Get blast radius for a specific file",
    description=(
        "Returns detailed blast radius analysis for a given file path within the analysis. "
        "Pass ?file_path=src/services/payment.js to specify the target file."
    ),
)
def get_blast_radius(
    analysis_id: uuid.UUID = Path(...),
    file_path: str = Query(..., description="Relative file path within the repository"),
    db: Session = Depends(get_db),
    current_user: Optional[AuthenticatedUser] = Depends(get_current_user_optional),
) -> BlastRadiusResponse:
    if _is_demo(analysis_id):
        if "payment" in file_path.lower():
            return DEMO_BLAST_RADIUS
        # Build partial demo response for other files
        demo = get_demo_analysis()
        demo_graph = DEMO_GRAPH
        return BlastRadiusResponse(
            target_file=file_path,
            score=15.0,
            impact_level=blast_svc.determine_impact_level(15.0),
            direct_dependents_count=1,
            total_affected_count=2,
            affected_files=[],
            evidence_chains=[],
            test_targets=[],
        )

    analysis = _get_analysis_or_404(db, analysis_id)
    if analysis.status != AnalysisStatus.COMPLETED:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Analysis is {analysis.status.value} — wait for COMPLETED status",
        )

    if not analysis.graph_data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Graph data not available")

    # Reconstruct graph and compute on-demand for the requested file
    import networkx as nx
    from app.schemas.graph import GraphResponse as GR
    gr = GR.model_validate(analysis.graph_data)

    G = nx.DiGraph()
    for node in gr.nodes:
        G.add_node(node.id, is_entry_point=node.is_entry_point, lines_of_code=node.lines_of_code)
    for edge in gr.edges:
        G.add_edge(edge.source, edge.target)

    all_files = [n.id for n in gr.nodes]
    return blast_svc.calculate_blast_radius(G, file_path, all_files)


# ─── GET /analyses/{id}/graph ───────────────────────────────────────────────────

@router.get(
    "/{analysis_id}/graph",
    response_model=GraphResponse,
    summary="Get full dependency graph",
)
def get_graph(
    analysis_id: uuid.UUID = Path(...),
    db: Session = Depends(get_db),
    current_user: Optional[AuthenticatedUser] = Depends(get_current_user_optional),
) -> GraphResponse:
    if _is_demo(analysis_id):
        return DEMO_GRAPH

    analysis = _get_analysis_or_404(db, analysis_id)
    if not analysis.graph_data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Graph not yet available")

    return GraphResponse.model_validate(analysis.graph_data)


# ─── GET /analyses/{id}/graph/{file_path} ──────────────────────────────────────

@router.get(
    "/{analysis_id}/graph/{file_path:path}",
    response_model=FileGraphResponse,
    summary="Get file-level subgraph",
    description="Returns immediate upstream dependencies and downstream dependents for a specific file.",
)
def get_file_graph(
    analysis_id: uuid.UUID = Path(...),
    file_path: str = Path(...),
    depth: int = Query(2, ge=1, le=5),
    db: Session = Depends(get_db),
    current_user: Optional[AuthenticatedUser] = Depends(get_current_user_optional),
) -> FileGraphResponse:
    if _is_demo(analysis_id):
        # Build subgraph from demo data
        import networkx as nx
        G = nx.DiGraph()
        for node in DEMO_GRAPH.nodes:
            G.add_node(node.id, is_entry_point=node.is_entry_point, lines_of_code=node.lines_of_code,
                       language=node.language, label=node.label, path=node.path, metadata={})
        for edge in DEMO_GRAPH.edges:
            G.add_edge(edge.source, edge.target)
        return graph_svc.get_file_subgraph(G, file_path, depth)

    analysis = _get_analysis_or_404(db, analysis_id)
    if not analysis.graph_data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Graph not yet available")

    import networkx as nx
    from app.schemas.graph import GraphResponse as GR
    gr = GR.model_validate(analysis.graph_data)

    G = nx.DiGraph()
    for node in gr.nodes:
        G.add_node(node.id, is_entry_point=node.is_entry_point, lines_of_code=node.lines_of_code,
                   language=node.language, label=node.label, path=node.path, metadata=node.metadata)
    for edge in gr.edges:
        G.add_edge(edge.source, edge.target)

    return graph_svc.get_file_subgraph(G, file_path, depth)


# ─── GET /analyses/{id}/findings ───────────────────────────────────────────────

@router.get(
    "/{analysis_id}/findings",
    response_model=list[FindingResponse],
    summary="Get all findings for an analysis",
)
def get_findings(
    analysis_id: uuid.UUID = Path(...),
    category: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    file_path: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: Optional[AuthenticatedUser] = Depends(get_current_user_optional),
) -> list[FindingResponse]:
    if _is_demo(analysis_id):
        from app.services.demo_fixture import DEMO_FINDINGS
        results = DEMO_FINDINGS
        if category:
            results = [f for f in results if f.category.value == category.upper()]
        if severity:
            results = [f for f in results if f.severity.value == severity.upper()]
        if file_path:
            results = [f for f in results if file_path in f.file_path]
        return results[offset : offset + limit]

    _get_analysis_or_404(db, analysis_id)
    query = db.query(Finding).filter(Finding.analysis_id == analysis_id)

    if category:
        from app.models.finding import FindingCategory
        try:
            query = query.filter(Finding.category == FindingCategory(category.upper()))
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid category: {category}")

    if severity:
        from app.models.finding import FindingSeverity
        try:
            query = query.filter(Finding.severity == FindingSeverity(severity.upper()))
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid severity: {severity}")

    if file_path:
        query = query.filter(Finding.file_path.contains(file_path))

    findings = query.order_by(Finding.created_at).offset(offset).limit(limit).all()
    return [FindingResponse.model_validate(f) for f in findings]


# ─── GET /analyses/{id}/findings/{finding_id} ──────────────────────────────────

@router.get(
    "/{analysis_id}/findings/{finding_id}",
    response_model=FindingResponse,
    summary="Get a single finding by ID",
)
def get_finding(
    analysis_id: uuid.UUID = Path(...),
    finding_id: uuid.UUID = Path(...),
    db: Session = Depends(get_db),
    current_user: Optional[AuthenticatedUser] = Depends(get_current_user_optional),
) -> FindingResponse:
    if _is_demo(analysis_id):
        from app.services.demo_fixture import DEMO_FINDINGS
        for f in DEMO_FINDINGS:
            if f.id == finding_id:
                return f
        raise HTTPException(status_code=404, detail="Finding not found")

    finding = (
        db.query(Finding)
        .filter(Finding.id == finding_id, Finding.analysis_id == analysis_id)
        .first()
    )
    if not finding:
        raise HTTPException(status_code=404, detail="Finding not found")
    return FindingResponse.model_validate(finding)


# ─── GET /analyses/{id}/quality ─────────────────────────────────────────────────

@router.get(
    "/{analysis_id}/quality",
    response_model=QualityResponse,
    summary="Get quality assessment",
    description="Returns the ISO/IEC 25010:2023-aligned quality assessment for the analysis.",
)
def get_quality(
    analysis_id: uuid.UUID = Path(...),
    db: Session = Depends(get_db),
    current_user: Optional[AuthenticatedUser] = Depends(get_current_user_optional),
) -> QualityResponse:
    if _is_demo(analysis_id):
        from app.services.demo_fixture import DEMO_QUALITY
        return DEMO_QUALITY

    analysis = _get_analysis_or_404(db, analysis_id)
    if not analysis.quality_details:
        raise HTTPException(status_code=404, detail="Quality data not yet available")

    return QualityResponse.model_validate(analysis.quality_details)


# ─── GET /analyses/{id}/testing ─────────────────────────────────────────────────

@router.get(
    "/{analysis_id}/testing",
    response_model=TestingResponse,
    summary="Get testing recommendations",
)
def get_testing(
    analysis_id: uuid.UUID = Path(...),
    db: Session = Depends(get_db),
    current_user: Optional[AuthenticatedUser] = Depends(get_current_user_optional),
) -> TestingResponse:
    if _is_demo(analysis_id):
        from app.services.demo_fixture import DEMO_TESTING
        return DEMO_TESTING

    analysis = _get_analysis_or_404(db, analysis_id)
    if not analysis.testing_details:
        raise HTTPException(status_code=404, detail="Testing data not yet available")

    return TestingResponse.model_validate(analysis.testing_details)


# ─── POST /analyses/{id}/chat ───────────────────────────────────────────────────

@router.post(
    "/{analysis_id}/chat",
    response_model=ChatResponse,
    summary="Ask AI about the analysis findings",
    description=(
        "Send a question to the Gemini AI explanation layer. "
        "Gemini explains findings, blast radius, and architecture — it NEVER calculates scores or graphs. "
        "All quantitative data is deterministically computed by the RepoLens engine."
    ),
)
async def chat(
    analysis_id: uuid.UUID = Path(...),
    body: ChatRequest = ...,
    db: Session = Depends(get_db),
    current_user: Optional[AuthenticatedUser] = Depends(get_current_user_optional),
) -> ChatResponse:
    from app.core.config import settings

    if _is_demo(analysis_id):
        if settings.GEMINI_API_KEY:
            demo_context = {
                "repo_name": "repolens-demo (paypal/paymentService.js)",
                "quality_score": 72.4,
                "blast_radius_max": 72.0,
                "file_count": 15,
                "total_findings": 4,
                "findings_summary": (
                    "1. CRITICAL (Security): Hardcoded payment gateway API secret in src/services/paymentService.js (line 14). "
                    "2. HIGH (Architecture): Circular dependency between src/services/paymentService.js and src/services/notificationService.js. "
                    "3. MEDIUM (Architecture): High fan-in on src/utils/logger.js (9 callers). "
                    "4. Blast radius analysis: paymentService.js changes affect 11 downstream files including 2 API entry points."
                ),
            }
            res = await chat_with_gemini(body, demo_context)
            if res.model_used != "fallback":
                return res
        return get_demo_chat_response(body.message)

    analysis = _get_analysis_or_404(db, analysis_id)

    # Collect findings summary for better AI grounding
    findings = (
        db.query(Finding)
        .filter(Finding.analysis_id == analysis_id)
        .limit(10)
        .all()
    )
    findings_summary = "; ".join(
        [f"{f.severity.value} ({f.category.value}): {f.title} in {f.file_path}" for f in findings]
    )

    # Build analysis context for Gemini
    context = {
        "repo_name": str(analysis.repository_id),
        "quality_score": analysis.quality_score,
        "blast_radius_max": analysis.blast_radius_max,
        "file_count": analysis.file_count,
        "total_findings": (analysis.summary or {}).get("total_findings", len(findings)),
        "findings_summary": findings_summary,
    }

    # Enrich with repo name if available
    repo = db.get(Repository, analysis.repository_id)
    if repo:
        context["repo_name"] = repo.name or repo.source_url

    return await chat_with_gemini(body, context)
