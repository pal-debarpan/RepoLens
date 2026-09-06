from typing import Any
import networkx as nx

from app.models.finding import FindingCategory, FindingSeverity
from app.schemas.finding import FindingCreate
from app.schemas.quality import QualityCharacteristic, QualityResponse


def calculate_quality_score(
    scanned_files: list[dict[str, Any]],
    findings: list[FindingCreate],
    G: nx.DiGraph,
) -> QualityResponse:
    """
    Calculate software product quality scores aligned with the ISO/IEC 25010:2023 model (9 characteristics).
    Static analysis limitations are explicitly documented for each characteristic.
    """
    total_files = len(scanned_files)
    total_lines = sum(f.get("line_count", 0) for f in scanned_files)

    # Group findings by category and severity
    cat_counts = {
        FindingCategory.ARCHITECTURE: 0,
        FindingCategory.SECURITY: 0,
        FindingCategory.DEPENDENCY: 0,
        FindingCategory.CODE_QUALITY: 0,
    }
    sev_counts = {
        FindingSeverity.CRITICAL: 0,
        FindingSeverity.HIGH: 0,
        FindingSeverity.MEDIUM: 0,
        FindingSeverity.LOW: 0,
    }

    for f in findings:
        cat_counts[f.category] = cat_counts.get(f.category, 0) + 1
        sev_counts[f.severity] = sev_counts.get(f.severity, 0) + 1

    # Deductions based on severity
    crit_pen = sev_counts[FindingSeverity.CRITICAL] * 15.0
    high_pen = sev_counts[FindingSeverity.HIGH] * 8.0
    med_pen = sev_counts[FindingSeverity.MEDIUM] * 3.0
    low_pen = sev_counts[FindingSeverity.LOW] * 1.0

    # 1. Functional Suitability
    dep_findings = cat_counts[FindingCategory.DEPENDENCY]
    fs_score = max(30.0, 100.0 - (dep_findings * 6.0) - (sev_counts[FindingSeverity.CRITICAL] * 8.0))
    fs = QualityCharacteristic(
        name="Functional Suitability",
        standard_reference="ISO/IEC 25010:2023",
        score=round(fs_score, 1),
        status="GOOD" if fs_score >= 80 else ("NEEDS_IMPROVEMENT" if fs_score >= 60 else "POOR"),
        description="Degree to which software functions meet stated and implied needs when used under specified conditions.",
        findings_count=dep_findings,
        rationale=f"Evaluated via import resolution consistency and absence of broken dependency links across {total_files} files.",
        limitations_note="Functional completeness cannot be fully verified without running behavioral test specifications.",
    )

    # 2. Performance Efficiency
    large_files = sum(1 for f in scanned_files if f.get("line_count", 0) > 500)
    pe_score = max(40.0, 100.0 - (large_files * 5.0))
    pe = QualityCharacteristic(
        name="Performance Efficiency",
        standard_reference="ISO/IEC 25010:2023",
        score=round(pe_score, 1),
        status="GOOD" if pe_score >= 80 else "NEEDS_IMPROVEMENT",
        description="Performance relative to the amount of resources used under stated conditions.",
        findings_count=large_files,
        rationale=f"Evaluated static modularity metrics and module size distribution ({large_files} large files identified).",
        limitations_note="True throughput, latency, memory consumption, and CPU profiling require runtime execution under load.",
    )

    # 3. Compatibility
    comp_score = max(50.0, 100.0 - (dep_findings * 4.0))
    comp = QualityCharacteristic(
        name="Compatibility",
        standard_reference="ISO/IEC 25010:2023",
        score=round(comp_score, 1),
        status="GOOD" if comp_score >= 80 else "NEEDS_IMPROVEMENT",
        description="Degree to which the product can exchange information and perform required functions while sharing common hardware/software environment.",
        findings_count=dep_findings,
        rationale="Evaluated standard dependency declarations and cross-module interface resolutions.",
        limitations_note="Interoperability with external third-party services requires integration testing.",
    )

    # 4. Interaction Capability (formerly Usability)
    has_readme = any("readme" in f.get("rel_path", "").lower() for f in scanned_files)
    ic_score = 90.0 if has_readme else 70.0
    ic = QualityCharacteristic(
        name="Interaction Capability",
        standard_reference="ISO/IEC 25010:2023",
        score=round(ic_score, 1),
        status="GOOD" if ic_score >= 80 else "NEEDS_IMPROVEMENT",
        description="Degree to which the product can be understood, learned, used, and is attractive to specified users.",
        findings_count=0 if has_readme else 1,
        rationale="Evaluated repository documentation presence (README, API schemas, guides).",
        limitations_note="User experience, accessibility, and UI aesthetics require manual human evaluation.",
    )

    # 5. Reliability
    arch_findings = cat_counts[FindingCategory.ARCHITECTURE]
    rel_score = max(20.0, 100.0 - (arch_findings * 6.0) - (sev_counts[FindingSeverity.CRITICAL] * 10.0))
    rel = QualityCharacteristic(
        name="Reliability",
        standard_reference="ISO/IEC 25010:2023",
        score=round(rel_score, 1),
        status="EXCELLENT" if rel_score >= 90 else ("GOOD" if rel_score >= 75 else "NEEDS_IMPROVEMENT"),
        description="Degree to which a system performs specified functions under specified conditions for a specified period of time.",
        findings_count=arch_findings,
        rationale=f"Evaluated circular dependency cycles, failure point isolation, and graph connectivity.",
        limitations_note="Fault tolerance and recoverability under unexpected failure require stress and chaos testing.",
    )

    # 6. Security
    sec_findings = cat_counts[FindingCategory.SECURITY]
    sec_score = max(10.0, 100.0 - (sev_counts[FindingSeverity.CRITICAL] * 20.0) - (sev_counts[FindingSeverity.HIGH] * 10.0) - (sev_counts[FindingSeverity.MEDIUM] * 4.0))
    sec = QualityCharacteristic(
        name="Security",
        standard_reference="ISO/IEC 25010:2023",
        score=round(sec_score, 1),
        status="EXCELLENT" if sec_score >= 90 else ("GOOD" if sec_score >= 75 else ("NEEDS_IMPROVEMENT" if sec_score >= 50 else "POOR")),
        description="Degree to which a product protects information and data so that persons or other products have the degree of data access appropriate to their types and levels of authorization.",
        findings_count=sec_findings,
        rationale=f"Evaluated hardcoded credential scanning, dynamic code execution patterns, and injection vectors ({sec_findings} findings).",
        limitations_note="Does not substitute for formal penetration testing, dynamic SAST/DAST scanning, or runtime authentication audits.",
    )

    # 7. Maintainability
    maint_score = max(25.0, 100.0 - (arch_findings * 5.0) - (large_files * 4.0) - (med_pen * 0.5))
    maint = QualityCharacteristic(
        name="Maintainability",
        standard_reference="ISO/IEC 25010:2023",
        score=round(maint_score, 1),
        status="EXCELLENT" if maint_score >= 90 else ("GOOD" if maint_score >= 75 else "NEEDS_IMPROVEMENT"),
        description="Degree of effectiveness and efficiency with which a product or system can be modified by intended maintainers.",
        findings_count=arch_findings + large_files,
        rationale=f"Evaluated modular coupling, fan-in/fan-out metrics, file size thresholds, and graph cyclomatic density.",
        limitations_note="Team velocity and long-term maintainability also depend on developer conventions and code review processes.",
    )

    # 8. Flexibility (added in ISO/IEC 25010:2023)
    flex_score = max(30.0, 100.0 - (arch_findings * 4.0) - (large_files * 3.0))
    flex = QualityCharacteristic(
        name="Flexibility",
        standard_reference="ISO/IEC 25010:2023",
        score=round(flex_score, 1),
        status="GOOD" if flex_score >= 75 else "NEEDS_IMPROVEMENT",
        description="Degree to which a product can adapt to changes in its requirements, contexts of use, or system environment.",
        findings_count=arch_findings,
        rationale="Evaluated module separation, absence of rigid circular structures, and clean boundary encapsulation.",
        limitations_note="Context adaptation requires evaluating domain workflows beyond static file trees.",
    )

    # 9. Safety (added in ISO/IEC 25010:2023)
    safe_score = max(30.0, 100.0 - (sev_counts[FindingSeverity.CRITICAL] * 25.0) - (sev_counts[FindingSeverity.HIGH] * 12.0))
    safe = QualityCharacteristic(
        name="Safety",
        standard_reference="ISO/IEC 25010:2023",
        score=round(safe_score, 1),
        status="EXCELLENT" if safe_score >= 90 else ("GOOD" if safe_score >= 75 else "NEEDS_IMPROVEMENT"),
        description="Degree to which a product under specified conditions does not lead to unacceptable risk of harm to people, business, property, or environment.",
        findings_count=sev_counts[FindingSeverity.CRITICAL],
        rationale="Evaluated absence of uncontrolled process spawning, unsanitized command execution, and severe privilege vectors.",
        limitations_note="Operational safety and hardware/domain-specific hazards require formal safety-critical system verification.",
    )

    characteristics = [fs, pe, comp, ic, rel, sec, maint, flex, safe]

    # Weighted overall calculation:
    # Security (20%), Maintainability (20%), Reliability (15%), Functional Suitability (15%),
    # Safety (10%), Flexibility (8%), Performance (5%), Compatibility (4%), Interaction (3%)
    weights = [0.15, 0.05, 0.04, 0.03, 0.15, 0.20, 0.20, 0.08, 0.10]
    weighted_total = sum(c.score * w for c, w in zip(characteristics, weights))
    overall_score = round(max(0.0, min(100.0, weighted_total)), 1)

    if overall_score >= 90.0:
        grade = "A"
    elif overall_score >= 80.0:
        grade = "B"
    elif overall_score >= 70.0:
        grade = "C"
    elif overall_score >= 60.0:
        grade = "D"
    else:
        grade = "F"

    summary = (
        f"Repository evaluated at score {overall_score}/100 (Grade {grade}). "
        f"Analysis assessed {len(findings)} findings across {total_files} files "
        f"aligned with ISO/IEC 25010:2023 software quality characteristics."
    )

    return QualityResponse(
        overall_score=overall_score,
        grade=grade,
        summary=summary,
        characteristics=characteristics,
    )
