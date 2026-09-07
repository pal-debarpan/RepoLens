import uuid
import logging
import threading
from typing import Optional

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Path, Query, Response, status
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
from app.schemas.vulnerability import VulnerabilitiesResponse
from app.schemas.sbom import CycloneDXBOM, SbomSummaryResponse
from app.services import blast_radius as blast_svc
from app.services import graph as graph_svc
from app.services import orchestrator, sbom_generator
from app.services.demo_fixture import (
    DEMO_ANALYSIS_ID,
    DEMO_BLAST_RADIUS,
    DEMO_GRAPH,
    DEMO_VULNERABILITIES,
    DEMO_SBOM,
    DEMO_SBOM_SUMMARY,
    get_demo_analysis,
    get_demo_chat_response,
)
from app.services.gemini import chat_with_gemini


logger = logging.getLogger(__name__)
router = APIRouter()

# Every analysis artifact belongs to an authenticated workspace.  Keep the
# legacy dependency name below only to avoid duplicating each route signature;
# it deliberately resolves to the strict verifier.
get_current_user_optional = get_current_user_required


# ─── Demo Detection & Scoped Analysis Retrieval ───────────────────────────────

def _is_demo(analysis_id: uuid.UUID) -> bool:
    # Analysis responses must always come from persisted repository data.  The
    # historical fixture is retained only for isolated service tests, never API
    # rendering or authenticated user traffic.
    return False


def _get_analysis_or_404(
    db: Session,
    analysis_id: uuid.UUID,
    user_id: Optional[uuid.UUID] = None,
) -> Analysis:
    """
    Retrieve an analysis and enforce tenant / user isolation.
    Returns 404 if the analysis does not exist or belongs to another user.
    """
    analysis = db.get(Analysis, analysis_id)
    if not analysis:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Analysis not found")
    
    # If analysis has an explicit owner, verify ownership
    if analysis.user_id is not None:
        if user_id is None or analysis.user_id != user_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Analysis not found")
    else:
        # Check parent repository ownership
        repo = db.get(Repository, analysis.repository_id)
        if repo and repo.user_id is not None:
            if user_id is None or repo.user_id != user_id:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Analysis not found")

    return analysis


# ─── POST /analyses ─────────────────────────────────────────────────────────────

@router.post(
    "",
    response_model=AnalysisResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Trigger a new analysis",
    description=(
        "Triggers a new asynchronous analysis pipeline for a repository. "
        "User ownership is validated — users can only trigger analysis on their own repositories or public demo fixtures. "
        "Authenticated analyses are linked to the user's workspace history."
    ),
)
def create_analysis(
    body: AnalysisCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user_required),
) -> AnalysisResponse:
    user_id = uuid.UUID(str(current_user.id))

    # Verify repository exists and belongs to current user
    repo = db.get(Repository, body.repository_id)
    if not repo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Repository {body.repository_id} not found",
        )

    if repo.user_id is not None and (user_id is None or repo.user_id != user_id):
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
    analysis = Analysis(
        repository_id=body.repository_id,
        user_id=user_id,
        commit_sha=body.commit_sha or repo.latest_commit_sha,
        status=AnalysisStatus.PENDING,
    )
    try:
        db.add(analysis)
        db.commit()
        db.refresh(analysis)
    except Exception as exc:
        db.rollback()
        logger.error("Failed to create analysis record: %s", exc, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create analysis record — please try again",
        )

    # Run pipeline in background thread
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
    summary="Get analysis history",
    description="Returns the analysis history. Accessible analyses include those for public repositories or owned by the authenticated user.",
)
def get_user_analyses(
    repository_id: Optional[uuid.UUID] = Query(None),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user_required),
) -> list[AnalysisResponse]:
    # If a specific repository is requested, check if the user can access it
    if repository_id:
        repo = db.get(Repository, repository_id)
        if not repo:
            return []
        
        user_id = uuid.UUID(str(current_user.id))
        
        if repo.user_id != user_id:
            return []
            
        query = db.query(Analysis).filter(Analysis.repository_id == repository_id)
    else:
        # If no repository specified, return analyses for all accessible repositories
        user_id = uuid.UUID(str(current_user.id))
        query = db.query(Analysis).join(Repository).filter(Repository.user_id == user_id)

    analyses = (
        query
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

    user_id = uuid.UUID(str(current_user.id)) if current_user else None
    analysis = _get_analysis_or_404(db, analysis_id, user_id)

    # Assemble detail with nested data from JSON columns
    from app.schemas.graph import GraphResponse
    from app.schemas.quality import QualityResponse
    from app.schemas.testing import TestingResponse

    graph_data = None
    quality_data = None
    testing_data = None
    vulnerability_data = None

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

    if analysis.vulnerability_details:
        try:
            vulnerability_data = VulnerabilitiesResponse.model_validate(analysis.vulnerability_details)
        except Exception:
            pass

    sbom_data = None
    if analysis.sbom_details:
        try:
            bom = CycloneDXBOM.model_validate(analysis.sbom_details)
            sbom_data = sbom_generator.summarize_sbom(bom)
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
        vulnerabilities=vulnerability_data,
        sbom=sbom_data,
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

    user_id = uuid.UUID(str(current_user.id)) if current_user else None
    analysis = _get_analysis_or_404(db, analysis_id, user_id)
    if analysis.status != AnalysisStatus.COMPLETED:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Analysis is {str(analysis.status)} — wait for COMPLETED status",
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

    user_id = uuid.UUID(str(current_user.id)) if current_user else None
    analysis = _get_analysis_or_404(db, analysis_id, user_id)
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
        import networkx as nx
        G = nx.DiGraph()
        for node in DEMO_GRAPH.nodes:
            G.add_node(node.id, is_entry_point=node.is_entry_point, lines_of_code=node.lines_of_code,
                       language=node.language, label=node.label, path=node.path, metadata={})
        for edge in DEMO_GRAPH.edges:
            G.add_edge(edge.source, edge.target)
        return graph_svc.get_file_subgraph(G, file_path, depth)

    user_id = uuid.UUID(str(current_user.id)) if current_user else None
    analysis = _get_analysis_or_404(db, analysis_id, user_id)
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

    user_id = uuid.UUID(str(current_user.id)) if current_user else None
    _get_analysis_or_404(db, analysis_id, user_id)
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

    user_id = uuid.UUID(str(current_user.id)) if current_user else None
    _get_analysis_or_404(db, analysis_id, user_id)
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

    user_id = uuid.UUID(str(current_user.id)) if current_user else None
    analysis = _get_analysis_or_404(db, analysis_id, user_id)
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

    user_id = uuid.UUID(str(current_user.id)) if current_user else None
    analysis = _get_analysis_or_404(db, analysis_id, user_id)
    if not analysis.testing_details:
        raise HTTPException(status_code=404, detail="Testing data not yet available")

    return TestingResponse.model_validate(analysis.testing_details)


# ─── GET /analyses/{id}/vulnerabilities ────────────────────────────────────────

@router.get(
    "/{analysis_id}/vulnerabilities",
    response_model=VulnerabilitiesResponse,
    summary="Get OSV vulnerability scan results",
    description="Returns the normalized OSV dependency vulnerability assessment for the analysis.",
)
def get_vulnerabilities(
    analysis_id: uuid.UUID = Path(...),
    db: Session = Depends(get_db),
    current_user: Optional[AuthenticatedUser] = Depends(get_current_user_optional),
) -> VulnerabilitiesResponse:
    if _is_demo(analysis_id):
        return DEMO_VULNERABILITIES

    user_id = uuid.UUID(str(current_user.id)) if current_user else None
    analysis = _get_analysis_or_404(db, analysis_id, user_id)
    if not analysis.vulnerability_details:
        return VulnerabilitiesResponse(packages_scanned=0, osv_available=True)

    try:
        return VulnerabilitiesResponse.model_validate(analysis.vulnerability_details)
    except Exception as e:
        logger.warning(f"Failed to deserialize vulnerability_details for {analysis_id}: {e}")
        return VulnerabilitiesResponse(
            packages_scanned=0,
            osv_available=False,
            error_message="Failed to load vulnerability data",
        )


# ─── GET /analyses/{id}/sbom ───────────────────────────────────────────────────

@router.get(
    "/{analysis_id}/sbom",
    response_model=CycloneDXBOM,
    summary="Get CycloneDX 1.5 JSON SBOM",
    description=(
        "Returns the full CycloneDX 1.5 JSON Software Bill of Materials (SBOM) for the analyzed repository. "
        "Use ?download=true to trigger a direct JSON file attachment download."
    ),
)
def get_sbom(
    analysis_id: uuid.UUID = Path(...),
    download: bool = Query(False, description="Set to true to download as repolens-sbom.json attachment"),
    db: Session = Depends(get_db),
    current_user: Optional[AuthenticatedUser] = Depends(get_current_user_optional),
):
    if _is_demo(analysis_id):
        sbom_bom = DEMO_SBOM
    else:
        user_id = uuid.UUID(str(current_user.id)) if current_user else None
        analysis = _get_analysis_or_404(db, analysis_id, user_id)
        if not analysis.sbom_details:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="SBOM data not available for this analysis",
            )
        try:
            sbom_bom = CycloneDXBOM.model_validate(analysis.sbom_details)
        except Exception as e:
            logger.warning(f"Failed to deserialize sbom_details for {analysis_id}: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to parse SBOM data",
            )

    if download:
        raw_json = sbom_bom.model_dump_json(by_alias=True, indent=2)
        filename = f"repolens-sbom-{str(analysis_id)[:8]}.json"
        return Response(
            content=raw_json,
            media_type="application/json",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )

    return sbom_bom


# ─── GET /analyses/{id}/sbom/summary ───────────────────────────────────────────

@router.get(
    "/{analysis_id}/sbom/summary",
    response_model=SbomSummaryResponse,
    summary="Get SBOM summary metrics and components",
    description="Returns a lightweight summary of the CycloneDX SBOM including component counts, direct/transitive breakdown, and ecosystems.",
)
def get_sbom_summary(
    analysis_id: uuid.UUID = Path(...),
    db: Session = Depends(get_db),
    current_user: Optional[AuthenticatedUser] = Depends(get_current_user_optional),
) -> SbomSummaryResponse:
    if _is_demo(analysis_id):
        return DEMO_SBOM_SUMMARY

    user_id = uuid.UUID(str(current_user.id)) if current_user else None
    analysis = _get_analysis_or_404(db, analysis_id, user_id)
    if not analysis.sbom_details:
        return SbomSummaryResponse(
            format="CycloneDX",
            spec_version="1.5",
            serial_number=f"urn:uuid:{analysis_id}",
            component_count=0,
            direct_count=0,
            transitive_count=0,
            vulnerable_components_count=0,
            ecosystems=[],
            components=[],
        )

    try:
        bom = CycloneDXBOM.model_validate(analysis.sbom_details)
        return sbom_generator.summarize_sbom(bom)
    except Exception as e:
        logger.warning(f"Failed to summarize sbom_details for {analysis_id}: {e}")
        return SbomSummaryResponse(
            format="CycloneDX",
            spec_version="1.5",
            serial_number=f"urn:uuid:{analysis_id}",
            component_count=0,
            direct_count=0,
            transitive_count=0,
            vulnerable_components_count=0,
            ecosystems=[],
            components=[],
        )




from app.schemas.architecture import UmlResponse
from app.services.uml_extractor import generate_plantuml
from app.models.analysis_graph_node import AnalysisGraphNode
from app.models.analysis_graph_edge import AnalysisGraphEdge

# ─── GET /analyses/{id}/architecture/uml ───────────────────────────────────────

@router.get(
    "/{analysis_id}/architecture/uml",
    response_model=UmlResponse,
    summary="Get UML Architecture Diagram",
    description="Returns the extracted detailed architecture nodes in PlantUML format.",
)
def get_architecture_uml(
    analysis_id: uuid.UUID = Path(...),
    db: Session = Depends(get_db),
    current_user: Optional[AuthenticatedUser] = Depends(get_current_user_optional),
) -> UmlResponse:
    if _is_demo(analysis_id):
        # Return a simple demo plantuml string
        return UmlResponse(
            diagram_type="plantuml",
            plantuml_source="@startuml\npackage \"src/demo.py\" {\n  class DemoApp as 1234\n}\n@enduml",
            total_nodes=1,
            total_edges=0
        )

    user_id = uuid.UUID(str(current_user.id)) if current_user else None
    analysis = _get_analysis_or_404(db, analysis_id, user_id)
    
    # Query architecture nodes
    nodes = db.query(AnalysisGraphNode).filter(AnalysisGraphNode.analysis_id == analysis_id).all()
    edges = db.query(AnalysisGraphEdge).filter(AnalysisGraphEdge.analysis_id == analysis_id).all()
    
    if not nodes:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Architecture data not available for this analysis"
        )
        
    puml = generate_plantuml(nodes, edges)
    
    return UmlResponse(
        diagram_type="plantuml",
        plantuml_source=puml,
        total_nodes=len(nodes),
        total_edges=len(edges)
    )

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

    user_id = uuid.UUID(str(current_user.id)) if current_user else None
    analysis = _get_analysis_or_404(db, analysis_id, user_id)

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
