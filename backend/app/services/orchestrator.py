"""
Analysis orchestrator: coordinates the full analysis pipeline.
Scan → Parse → Resolve → Build Graph → Calculate Blast Radius → Analyze Findings → Quality Score → Testing
"""
import logging
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from sqlalchemy.orm import Session

from app.models.analysis import Analysis, AnalysisStatus
from app.models.finding import Finding
from app.schemas.finding import FindingCreate
from app.services import (
    architecture,
    blast_radius as blast_svc,
    dependency,
    entry_points as ep_svc,
    graph as graph_svc,
    osv_service,
    parser,
    quality as quality_svc,
    scanner,
    sbom_generator,
    security,
    testing as testing_svc,
)
from app.services.resolver import resolve_import
from app.schemas.vulnerability import VulnerabilitiesResponse
from app.schemas.sbom import CycloneDXBOM


logger = logging.getLogger(__name__)


def _detect_primary_language(scanned_files: list[dict[str, Any]]) -> str | None:
    lang_counts: dict[str, int] = {}
    for f in scanned_files:
        lang = f.get("language")
        if lang and f.get("is_code"):
            lang_counts[lang] = lang_counts.get(lang, 0) + f.get("line_count", 1)
    return max(lang_counts, key=lang_counts.get) if lang_counts else None


def run_analysis_pipeline(
    db: Session,
    analysis_id: uuid.UUID,
    workspace_path: str,
    user_id: uuid.UUID | None = None,
) -> None:
    """
    Execute the full analysis pipeline for a repository workspace.
    Updates analysis DB record with results upon completion.
    Does NOT execute any repository code.
    """
    analysis = db.get(Analysis, analysis_id)
    if not analysis:
        logger.error("Analysis %s not found in DB", analysis_id)
        return

    try:
        analysis.status = AnalysisStatus.RUNNING
        db.commit()

        # ── Step 1: Scan workspace ─────────────────────────────────────────
        logger.info("[%s] Scanning workspace: %s", analysis_id, workspace_path)
        raw_files = scanner.scan_workspace(workspace_path)

        if not raw_files:
            raise ValueError("No scannable files found in workspace")

        all_file_paths = {f.rel_path for f in raw_files}

        # ── Step 2: Parse source files ─────────────────────────────────────
        logger.info("[%s] Parsing %d files", analysis_id, len(raw_files))
        parsed_by_path: dict[str, Any] = {}
        file_records: list[dict[str, Any]] = []

        for sf in raw_files:
            file_record: dict[str, Any] = {
                "rel_path": sf.rel_path,
                "abs_path": sf.abs_path,
                "language": sf.language,
                "is_code": sf.is_code,
                "line_count": sf.line_count,
                "size_bytes": sf.size_bytes,
                "is_entry_point": False,
                "metadata": {},
            }

            if sf.is_code:
                try:
                    code_bytes = Path(sf.abs_path).read_bytes()
                    parsed = parser.parse_source_code(sf.rel_path, code_bytes, sf.language)
                    parsed_by_path[sf.rel_path] = parsed

                    # Entry point detection (filename + content heuristic)
                    code_str = code_bytes.decode("utf-8", errors="replace")
                    file_record["is_entry_point"] = ep_svc.is_entry_point(sf.rel_path, code_str)
                except Exception as e:
                    logger.debug("Error parsing %s: %s", sf.rel_path, e)
                    file_record["is_entry_point"] = ep_svc.is_entry_point(sf.rel_path)
            else:
                file_record["is_entry_point"] = ep_svc.is_entry_point(sf.rel_path)

            file_records.append(file_record)

        # ── Step 3: Resolve imports ────────────────────────────────────────
        logger.info("[%s] Resolving imports", analysis_id)
        resolved_deps: dict[str, list[str]] = {}

        for rel_path, parsed in parsed_by_path.items():
            local_targets: list[str] = []
            for raw_imp in parsed.imports:
                ri = resolve_import(rel_path, raw_imp, all_file_paths, parsed.language)
                if ri.is_local and ri.resolved_path:
                    local_targets.append(ri.resolved_path)
            if local_targets:
                resolved_deps[rel_path] = local_targets

        # ── Step 4: Build dependency graph ─────────────────────────────────
        logger.info("[%s] Building dependency graph", analysis_id)
        G = graph_svc.build_dependency_graph(file_records, resolved_deps)

        # ── Step 5: Compute blast radius scores ────────────────────────────
        logger.info("[%s] Computing blast radius scores", analysis_id)
        all_file_list = [f["rel_path"] for f in file_records]
        blast_scores = blast_svc.compute_all_blast_scores(G, all_file_list)

        # Attach blast scores to file records
        for fr in file_records:
            fr["blast_radius_score"] = blast_scores.get(fr["rel_path"], 0.0)

        # ── Step 6: Detect findings ────────────────────────────────────────
        logger.info("[%s] Analyzing findings", analysis_id)
        all_findings: list[FindingCreate] = []

        # Architecture
        all_findings.extend(architecture.analyze_architecture(G, file_records))

        # Security
        all_findings.extend(security.analyze_security(workspace_path, file_records))

        # Dependency
        all_findings.extend(dependency.analyze_dependencies(workspace_path, parsed_by_path, all_file_paths))

        # ── Step 7.5: OSV Vulnerability Analysis ──────────────────────────
        # Queries the OSV API for each detected dependency.
        # Results are:
        #   (a) Converted to SECURITY findings so they feed the existing
        #       quality-scoring security penalty formula.
        #   (b) Persisted separately as vulnerability_details (JSON) for the
        #       dedicated /analyses/{id}/vulnerabilities endpoint.
        # OSV errors are fully isolated — the pipeline never crashes.
        logger.info("[%s] Running OSV vulnerability analysis", analysis_id)
        osv_result: VulnerabilitiesResponse = osv_service.run_osv_analysis(
            workspace_path, parsed_by_path
        )
        osv_findings = osv_service.findings_from_osv(osv_result)
        all_findings.extend(osv_findings)
        if osv_findings:
            logger.info(
                "[%s] OSV: %d vulnerability findings added to pipeline",
                analysis_id, len(osv_findings),
            )

        # ── Step 7.6: CycloneDX SBOM Generation ───────────────────────────
        # Generates a standard CycloneDX 1.5 JSON Software Bill of Materials (SBOM)
        # enriched with PURLs, direct/transitive status, blast-radius affected files,
        # and correlated OSV vulnerability counts.
        logger.info("[%s] Generating CycloneDX SBOM", analysis_id)
        repo_display_name = getattr(analysis.repository, "name", None) or "repository"
        sbom_result: CycloneDXBOM = sbom_generator.generate_cyclonedx_sbom(
            workspace_root=workspace_path,
            parsed_files=parsed_by_path,
            vulnerabilities=osv_result,
            repo_name=repo_display_name,
            commit_sha=analysis.commit_sha,
        )

        # ── Step 7: Quality score ──────────────────────────────────────────
        logger.info("[%s] Computing quality score", analysis_id)
        quality_result = quality_svc.calculate_quality_score(file_records, all_findings, G)

        # ── Step 8: Testing recommendations ───────────────────────────────
        logger.info("[%s] Generating testing recommendations", analysis_id)
        entry_points_list = [f["rel_path"] for f in file_records if f.get("is_entry_point")]
        testing_result = testing_svc.generate_testing_recommendations(
            G, blast_scores, file_records, entry_points_list
        )

        # ── Step 9: Serialize graph ────────────────────────────────────────
        graph_response = graph_svc.serialize_graph_response(G, blast_scores)

        # ── Step 10: Persist results ───────────────────────────────────────
        logger.info("[%s] Persisting results (%d findings)", analysis_id, len(all_findings))

        total_lines = sum(f.get("line_count", 0) for f in file_records)
        primary_lang = _detect_primary_language(file_records)
        blast_values = [v for v in blast_scores.values() if v > 0]

        analysis.status = AnalysisStatus.COMPLETED
        analysis.file_count = len(file_records)
        analysis.total_lines = total_lines
        analysis.primary_language = primary_lang
        analysis.quality_score = quality_result.overall_score
        analysis.blast_radius_max = round(max(blast_values), 2) if blast_values else 0.0
        analysis.blast_radius_avg = round(sum(blast_values) / len(blast_values), 2) if blast_values else 0.0
        analysis.completed_at = datetime.now(timezone.utc)

        # Summary payload
        cat_counts = {}
        sev_counts = {}
        for f in all_findings:
            cat_counts[f.category.value] = cat_counts.get(f.category.value, 0) + 1
            sev_counts[f.severity.value] = sev_counts.get(f.severity.value, 0) + 1

        analysis.summary = {
            "total_files": len(file_records),
            "total_lines": total_lines,
            "total_findings": len(all_findings),
            "findings_by_category": cat_counts,
            "findings_by_severity": sev_counts,
            "quality_score": quality_result.overall_score,
            "quality_grade": quality_result.grade,
            "sbom_component_count": len(sbom_result.components),
        }

        # Graph data (serialized)
        analysis.graph_data = graph_response.model_dump()

        # Quality details
        analysis.quality_details = quality_result.model_dump()

        # Testing details
        analysis.testing_details = testing_result.model_dump()

        # Vulnerability details (OSV scan results)
        analysis.vulnerability_details = osv_result.model_dump()

        # SBOM details (CycloneDX 1.5 JSON)
        analysis.sbom_details = sbom_result.model_dump(by_alias=True)


        # Persist findings
        for fc in all_findings:
            finding = Finding(
                analysis_id=analysis.id,
                category=fc.category,
                severity=fc.severity,
                title=fc.title,
                description=fc.description,
                file_path=fc.file_path,
                line_number=fc.line_number,
                evidence=fc.evidence,
                suggested_fix=fc.suggested_fix,
                metadata_payload=fc.metadata_payload,
            )
            db.add(finding)

        db.commit()
        logger.info("[%s] Analysis completed successfully", analysis_id)

    except Exception as e:
        logger.exception("[%s] Analysis pipeline failed: %s", analysis_id, str(e))
        try:
            analysis.status = AnalysisStatus.FAILED
            analysis.error_message = str(e)[:500]
            db.commit()
        except Exception:
            db.rollback()
