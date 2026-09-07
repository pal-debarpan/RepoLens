"""
Demo fixture: deterministic 'repolens-demo' analysis response.

This fixture returns a stable, consistent analysis result for the
demo repository (paypal/paymentService.js pattern) that showcases all
RepoLens features end-to-end without requiring a live repository clone.

Values are hard-coded and deterministic — not AI-generated.
"""
from uuid import UUID, uuid5, NAMESPACE_URL
from datetime import datetime, timezone

from app.schemas.analysis import AnalysisResponse, AnalysisDetailResponse
from app.schemas.blast_radius import BlastRadiusResponse, AffectedFile, ImpactLevel
from app.schemas.chat import ChatResponse
from app.schemas.finding import FindingResponse
from app.schemas.graph import GraphEdge, GraphNode, GraphResponse
from app.schemas.quality import QualityCharacteristic, QualityResponse
from app.schemas.testing import TestRecommendation, TestingPriority, TestingResponse
from app.schemas.vulnerability import VulnerabilitiesResponse, VulnerabilityItem, VulnerablePackage
from app.schemas.sbom import (
    CycloneDXBOM,
    CycloneDXComponent,
    CycloneDXDependency,
    CycloneDXMetadata,
    CycloneDXMetadataComponent,
    SbomSummaryResponse,
)
from app.services.sbom_generator import summarize_sbom
from app.models.analysis import AnalysisStatus
from app.models.finding import FindingCategory, FindingSeverity


DEMO_REPO_URL = "https://github.com/repolens/repolens-demo"
DEMO_ANALYSIS_ID = uuid5(NAMESPACE_URL, DEMO_REPO_URL)
DEMO_REPO_ID = uuid5(NAMESPACE_URL, "repolens-demo-repo")
DEMO_CREATED_AT = datetime(2025, 1, 15, 10, 0, 0, tzinfo=timezone.utc)
DEMO_COMPLETED_AT = datetime(2025, 1, 15, 10, 0, 12, tzinfo=timezone.utc)

DEMO_FILES = [
    "src/services/paymentService.js",
    "src/services/notificationService.js",
    "src/services/userService.js",
    "src/controllers/paymentController.js",
    "src/controllers/checkoutController.js",
    "src/controllers/adminController.js",
    "src/middleware/auth.js",
    "src/middleware/rateLimit.js",
    "src/models/Payment.js",
    "src/models/User.js",
    "src/utils/crypto.js",
    "src/utils/logger.js",
    "tests/payment.test.js",
    "tests/user.test.js",
    "index.js",
]

DEMO_FINDINGS = [
    FindingResponse(
        id=uuid5(NAMESPACE_URL, "finding-1"),
        analysis_id=DEMO_ANALYSIS_ID,
        category=FindingCategory.SECURITY,
        severity=FindingSeverity.CRITICAL,
        title="Hardcoded payment gateway API secret",
        description=(
            "The file 'src/services/paymentService.js' contains a hardcoded API secret "
            "for the payment gateway. Secrets in version control can be extracted by "
            "anyone with access to the repository history."
        ),
        file_path="src/services/paymentService.js",
        line_number=14,
        evidence='const GATEWAY_KEY = "sk_li...****...Xp9";',
        suggested_fix="Use environment variables (process.env.GATEWAY_SECRET_KEY) and a secrets manager.",
        metadata_payload={"rule": "Generic Hardcoded API Secret"},
        created_at=DEMO_CREATED_AT,
    ),
    FindingResponse(
        id=uuid5(NAMESPACE_URL, "finding-2"),
        analysis_id=DEMO_ANALYSIS_ID,
        category=FindingCategory.ARCHITECTURE,
        severity=FindingSeverity.HIGH,
        title="Circular dependency: paymentService ↔ notificationService",
        description=(
            "src/services/paymentService.js and src/services/notificationService.js "
            "form a circular dependency cycle. This causes unpredictable module initialization "
            "order and complicates unit testing."
        ),
        file_path="src/services/paymentService.js",
        line_number=1,
        evidence="paymentService.js -> notificationService.js -> paymentService.js",
        suggested_fix="Extract shared notification logic into a separate event emitter or pub-sub module.",
        metadata_payload={"cycle": ["src/services/paymentService.js", "src/services/notificationService.js"]},
        created_at=DEMO_CREATED_AT,
    ),
    FindingResponse(
        id=uuid5(NAMESPACE_URL, "finding-3"),
        analysis_id=DEMO_ANALYSIS_ID,
        category=FindingCategory.ARCHITECTURE,
        severity=FindingSeverity.MEDIUM,
        title="High fan-in on src/utils/logger.js (9 dependents)",
        description=(
            "src/utils/logger.js is imported by 9 files across the codebase. "
            "Changes to logging configuration or interface will require broad testing."
        ),
        file_path="src/utils/logger.js",
        line_number=1,
        evidence="In-degree: 9 callers",
        suggested_fix="Ensure logger maintains a stable interface. Use a logger facade pattern.",
        metadata_payload={"in_degree": 9},
        created_at=DEMO_CREATED_AT,
    ),
    FindingResponse(
        id=uuid5(NAMESPACE_URL, "finding-4"),
        analysis_id=DEMO_ANALYSIS_ID,
        category=FindingCategory.DEPENDENCY,
        severity=FindingSeverity.MEDIUM,
        title="Unresolved local import './legacyPaymentAdapter'",
        description=(
            "src/services/paymentService.js imports './legacyPaymentAdapter' but no matching "
            "file was found. This will cause a runtime module not found error."
        ),
        file_path="src/services/paymentService.js",
        line_number=8,
        evidence="require('./legacyPaymentAdapter')",
        suggested_fix="Create the missing module or remove the unused import.",
        metadata_payload={"import": "./legacyPaymentAdapter"},
        created_at=DEMO_CREATED_AT,
    ),
]

DEMO_GRAPH_NODES = [
    GraphNode(id=f, label=f.split("/")[-1], path=f, language="javascript",
              lines_of_code=80 + i * 12,
              in_degree=[1, 3, 2, 2, 1, 1, 5, 3, 2, 2, 9, 7, 0, 0, 0][i],
              out_degree=[4, 2, 2, 3, 3, 2, 2, 1, 1, 1, 1, 0, 2, 1, 0][i],
              is_entry_point=f in {"src/controllers/paymentController.js", "src/controllers/checkoutController.js", "index.js"})
    for i, f in enumerate(DEMO_FILES)
]

DEMO_GRAPH_EDGES = [
    GraphEdge(source="src/controllers/paymentController.js", target="src/services/paymentService.js"),
    GraphEdge(source="src/controllers/checkoutController.js", target="src/services/paymentService.js"),
    GraphEdge(source="src/controllers/checkoutController.js", target="src/services/userService.js"),
    GraphEdge(source="src/controllers/adminController.js", target="src/services/userService.js"),
    GraphEdge(source="src/services/paymentService.js", target="src/models/Payment.js"),
    GraphEdge(source="src/services/paymentService.js", target="src/utils/logger.js"),
    GraphEdge(source="src/services/paymentService.js", target="src/utils/crypto.js"),
    GraphEdge(source="src/services/paymentService.js", target="src/services/notificationService.js"),
    GraphEdge(source="src/services/notificationService.js", target="src/services/paymentService.js"),  # cycle!
    GraphEdge(source="src/services/notificationService.js", target="src/utils/logger.js"),
    GraphEdge(source="src/services/userService.js", target="src/models/User.js"),
    GraphEdge(source="src/services/userService.js", target="src/utils/logger.js"),
    GraphEdge(source="src/middleware/auth.js", target="src/utils/logger.js"),
    GraphEdge(source="src/middleware/auth.js", target="src/models/User.js"),
    GraphEdge(source="index.js", target="src/controllers/paymentController.js"),
    GraphEdge(source="index.js", target="src/middleware/auth.js"),
]

DEMO_GRAPH = GraphResponse(
    nodes=DEMO_GRAPH_NODES,
    edges=DEMO_GRAPH_EDGES,
    total_nodes=len(DEMO_GRAPH_NODES),
    total_edges=len(DEMO_GRAPH_EDGES),
    density=0.076,
    has_cycles=True,
    cycles=[["src/services/paymentService.js", "src/services/notificationService.js"]],
)

DEMO_QUALITY = QualityResponse(
    overall_score=72.4,
    grade="C",
    summary=(
        "Repository evaluated at score 72.4/100 (Grade C). "
        "4 findings across 15 files were identified including 1 critical security issue. "
        "Aligned with ISO/IEC 25010:2023 product quality characteristics."
    ),
    characteristics=[
        QualityCharacteristic(name="Functional Suitability", score=80.0, status="GOOD",
            description="Degree to which software functions meet stated and implied needs.",
            findings_count=1, rationale="1 broken import detected. Remaining dependency structure is consistent.",
            limitations_note="Runtime behavioral correctness requires test execution."),
        QualityCharacteristic(name="Performance Efficiency", score=82.0, status="GOOD",
            description="Performance relative to resources used under stated conditions.",
            findings_count=0, rationale="No monolithic file violations. Module sizes are appropriate.",
            limitations_note="Runtime latency and throughput require load testing."),
        QualityCharacteristic(name="Compatibility", score=85.0, status="GOOD",
            description="Degree to which the product can exchange information with other systems.",
            findings_count=0, rationale="Standard CommonJS/ES module patterns used consistently.",
            limitations_note="Third-party API compatibility requires integration testing."),
        QualityCharacteristic(name="Interaction Capability", score=88.0, status="GOOD",
            description="Degree to which the product can be understood, learned, and used.",
            findings_count=0, rationale="README and documentation files detected.",
            limitations_note="UX and end-user accessibility require manual evaluation."),
        QualityCharacteristic(name="Reliability", score=64.0, status="NEEDS_IMPROVEMENT",
            description="Degree to which a system performs functions under specified conditions.",
            findings_count=2, rationale="Circular dependency detected between paymentService and notificationService increases reliability risk.",
            limitations_note="Fault tolerance requires chaos/stress testing."),
        QualityCharacteristic(name="Security", score=45.0, status="POOR",
            description="Degree to which a product protects information and data.",
            findings_count=1, rationale="1 CRITICAL finding: Hardcoded payment gateway API key in source control.",
            limitations_note="Does not substitute formal penetration testing or DAST scanning."),
        QualityCharacteristic(name="Maintainability", score=68.0, status="NEEDS_IMPROVEMENT",
            description="Degree of effectiveness with which a product can be modified.",
            findings_count=3, rationale="Circular dependencies and high fan-in hub (logger.js) reduce long-term maintainability.",
            limitations_note="Team process factors require human evaluation."),
        QualityCharacteristic(name="Flexibility", score=71.0, status="NEEDS_IMPROVEMENT",
            description="Degree to which a product can adapt to changes.",
            findings_count=2, rationale="Circular coupling reduces adaptability of payment and notification domains.",
            limitations_note="Contextual adaptation requires domain workflow analysis."),
        QualityCharacteristic(name="Safety", score=70.0, status="NEEDS_IMPROVEMENT",
            description="Degree to which a product does not lead to unacceptable risk of harm.",
            findings_count=1, rationale="Hardcoded credentials represent a critical safety concern for payment data integrity.",
            limitations_note="Domain-specific safety analysis requires expert review."),
    ],
)

DEMO_BLAST_RADIUS = BlastRadiusResponse(
    target_file="src/services/paymentService.js",
    score=72.0,
    impact_level=ImpactLevel.HIGH,
    direct_dependents_count=2,
    total_affected_count=11,
    affected_files=[
        AffectedFile(file_path="src/controllers/paymentController.js", distance=1, impact_score=90.0, impact_level=ImpactLevel.CRITICAL, reason="Directly imports this file [High Impact: Application Entry Point / API Route]", import_chain=["src/services/paymentService.js", "src/controllers/paymentController.js"]),
        AffectedFile(file_path="src/controllers/checkoutController.js", distance=1, impact_score=90.0, impact_level=ImpactLevel.CRITICAL, reason="Directly imports this file [High Impact: Application Entry Point / API Route]", import_chain=["src/services/paymentService.js", "src/controllers/checkoutController.js"]),
        AffectedFile(file_path="src/services/notificationService.js", distance=1, impact_score=80.0, impact_level=ImpactLevel.CRITICAL, reason="Directly imports this file (circular dependency)", import_chain=["src/services/paymentService.js", "src/services/notificationService.js"]),
        AffectedFile(file_path="index.js", distance=2, impact_score=55.0, impact_level=ImpactLevel.HIGH, reason="Transitively depends on this file (step 2)", import_chain=["src/services/paymentService.js", "src/controllers/paymentController.js", "index.js"]),
        AffectedFile(file_path="src/middleware/auth.js", distance=3, impact_score=35.0, impact_level=ImpactLevel.MEDIUM, reason="Transitively depends on this file (step 3)", import_chain=["src/services/paymentService.js", "src/controllers/paymentController.js", "index.js", "src/middleware/auth.js"]),
    ],
    evidence_chains=[
        ["src/services/paymentService.js", "src/controllers/paymentController.js", "index.js"],
        ["src/services/paymentService.js", "src/controllers/checkoutController.js", "index.js"],
    ],
    test_targets=["tests/payment.test.js"],
)

DEMO_TESTING = TestingResponse(
    total_recommendations=4,
    high_priority_count=2,
    test_coverage_estimated=None,
    existing_test_files_count=2,
    recommendations=[
        TestRecommendation(
            id="rec-001",
            priority=TestingPriority.HIGH,
            target_file="src/services/paymentService.js",
            test_file_hint="tests/paymentService.test.js",
            reason="High blast radius score (72/100) — changes propagate widely | No corresponding test file detected | Affects 2 entry point(s) transitively",
            blast_radius_score=72.0,
            affected_entry_points=["src/controllers/paymentController.js", "index.js"],
            suggested_test_types=["unit", "integration", "regression"],
        ),
        TestRecommendation(
            id="rec-002",
            priority=TestingPriority.HIGH,
            target_file="src/services/notificationService.js",
            test_file_hint="tests/notificationService.test.js",
            reason="Circular dependency creates unpredictable test isolation | Affects 1 entry point(s) transitively",
            blast_radius_score=45.0,
            affected_entry_points=["index.js"],
            suggested_test_types=["unit", "integration"],
        ),
        TestRecommendation(
            id="rec-003",
            priority=TestingPriority.MEDIUM,
            target_file="src/utils/logger.js",
            test_file_hint="tests/logger.test.js",
            reason="High fan-in (9 dependents) — changes to logger interface affect the entire codebase",
            blast_radius_score=55.0,
            affected_entry_points=["index.js"],
            suggested_test_types=["unit", "regression"],
        ),
        TestRecommendation(
            id="rec-004",
            priority=TestingPriority.MEDIUM,
            target_file="src/utils/crypto.js",
            test_file_hint="tests/crypto.test.js",
            reason="No corresponding test file detected | Security-sensitive utility used in payment flow",
            blast_radius_score=30.0,
            affected_entry_points=[],
            suggested_test_types=["unit"],
        ),
    ],
)

# ── Demo Vulnerability Data (OSV) ─────────────────────────────────────────────
DEMO_VULNERABILITIES = VulnerabilitiesResponse(
    packages_scanned=6,
    vulnerable_packages=[
        VulnerablePackage(
            package_name="axios",
            version="0.21.1",
            ecosystem="npm",
            vulnerabilities=[
                VulnerabilityItem(
                    id="GHSA-42xw-2xvc-qx8m",
                    summary="axios vulnerable to Server-Side Request Forgery (SSRF)",
                    severity="HIGH",
                    fixed_versions=["0.21.2"],
                    references=["https://github.com/advisories/GHSA-42xw-2xvc-qx8m"],
                ),
            ],
            affected_files=[
                "src/services/paymentService.js",
                "src/services/notificationService.js",
                "src/controllers/checkoutController.js",
            ],
        ),
        VulnerablePackage(
            package_name="lodash",
            version="4.17.15",
            ecosystem="npm",
            vulnerabilities=[
                VulnerabilityItem(
                    id="GHSA-35jh-r3h4-6jhm",
                    summary="Lodash prototype pollution via zip function",
                    severity="MEDIUM",
                    fixed_versions=["4.17.21"],
                    references=["https://github.com/advisories/GHSA-35jh-r3h4-6jhm"],
                ),
            ],
            affected_files=[
                "src/utils/crypto.js",
                "src/models/Payment.js",
            ],
        ),
    ],
    total_vulnerabilities=2,
    osv_available=True,
)

# ── Demo SBOM Data (CycloneDX 1.5 JSON) ───────────────────────────────────────
DEMO_SBOM = CycloneDXBOM(
    bomFormat="CycloneDX",
    specVersion="1.5",
    serialNumber="urn:uuid:545b844d-271b-566a-be6a-71a00c89c96c",
    version=1,
    metadata=CycloneDXMetadata(
        component=CycloneDXMetadataComponent(
            type="application",
            name="repolens-demo",
            version="1.0.0",
            description="PayPal / paymentService.js demonstration codebase",
        )
    ),
    components=[
        CycloneDXComponent(
            type="library",
            name="axios",
            version="0.21.1",
            bom_ref="pkg:npm/axios@0.21.1",
            purl="pkg:npm/axios@0.21.1",
            scope="required",
            ecosystem="npm",
            direct=True,
            description="Promise based HTTP client for node.js and browser",
            affected_files=[
                "src/services/paymentService.js",
                "src/services/notificationService.js",
                "src/controllers/checkoutController.js",
            ],
            vulnerabilities_count=1,
        ),
        CycloneDXComponent(
            type="library",
            name="lodash",
            version="4.17.15",
            bom_ref="pkg:npm/lodash@4.17.15",
            purl="pkg:npm/lodash@4.17.15",
            scope="required",
            ecosystem="npm",
            direct=True,
            description="Lodash modular utilities",
            affected_files=[
                "src/utils/crypto.js",
                "src/models/Payment.js",
            ],
            vulnerabilities_count=1,
        ),
        CycloneDXComponent(
            type="library",
            name="express",
            version="4.18.2",
            bom_ref="pkg:npm/express@4.18.2",
            purl="pkg:npm/express@4.18.2",
            scope="required",
            ecosystem="npm",
            direct=True,
            description="Fast, unopinionated, minimalist web framework for node",
            affected_files=[
                "index.js",
                "src/controllers/paymentController.js",
                "src/controllers/checkoutController.js",
                "src/controllers/adminController.js",
            ],
            vulnerabilities_count=0,
        ),
        CycloneDXComponent(
            type="library",
            name="jsonwebtoken",
            version="9.0.2",
            bom_ref="pkg:npm/jsonwebtoken@9.0.2",
            purl="pkg:npm/jsonwebtoken@9.0.2",
            scope="required",
            ecosystem="npm",
            direct=True,
            description="JSON Web Token implementation (symmetric and asymmetric)",
            affected_files=[
                "src/middleware/auth.js",
            ],
            vulnerabilities_count=0,
        ),
        CycloneDXComponent(
            type="library",
            name="body-parser",
            version="1.20.2",
            bom_ref="pkg:npm/body-parser@1.20.2",
            purl="pkg:npm/body-parser@1.20.2",
            scope="optional",
            ecosystem="npm",
            direct=False,
            description="Node.js body parsing middleware",
            affected_files=[],
            vulnerabilities_count=0,
        ),
        CycloneDXComponent(
            type="library",
            name="debug",
            version="4.3.4",
            bom_ref="pkg:npm/debug@4.3.4",
            purl="pkg:npm/debug@4.3.4",
            scope="optional",
            ecosystem="npm",
            direct=False,
            description="Small debugging utility",
            affected_files=[],
            vulnerabilities_count=0,
        ),
    ],
    dependencies=[
        CycloneDXDependency(
            ref="pkg:application/repolens-demo@1.0.0",
            dependsOn=[
                "pkg:npm/axios@0.21.1",
                "pkg:npm/lodash@4.17.15",
                "pkg:npm/express@4.18.2",
                "pkg:npm/jsonwebtoken@9.0.2",
            ],
        ),
        CycloneDXDependency(
            ref="pkg:npm/express@4.18.2",
            dependsOn=[
                "pkg:npm/body-parser@1.20.2",
                "pkg:npm/debug@4.3.4",
            ],
        ),
    ],
)

DEMO_SBOM_SUMMARY = summarize_sbom(DEMO_SBOM)


def get_demo_analysis() -> AnalysisDetailResponse:
    """Return fully assembled demo analysis response."""
    return AnalysisDetailResponse(
        id=DEMO_ANALYSIS_ID,
        repository_id=DEMO_REPO_ID,
        user_id=None,
        status=AnalysisStatus.COMPLETED,
        commit_sha="a1b2c3d4e5f6",
        file_count=15,
        total_lines=1842,
        primary_language="javascript",
        quality_score=72.4,
        blast_radius_max=72.0,
        blast_radius_avg=38.5,
        summary={
            "total_files": 15,
            "total_lines": 1842,
            "total_findings": 4,
            "findings_by_category": {"SECURITY": 1, "ARCHITECTURE": 2, "DEPENDENCY": 1},
            "findings_by_severity": {"CRITICAL": 1, "HIGH": 1, "MEDIUM": 2},
            "quality_score": 72.4,
            "quality_grade": "C",
            "sbom_component_count": 6,
        },
        created_at=DEMO_CREATED_AT,
        completed_at=DEMO_COMPLETED_AT,
        graph=DEMO_GRAPH,
        quality=DEMO_QUALITY,
        testing=DEMO_TESTING,
        vulnerabilities=DEMO_VULNERABILITIES,
        sbom=DEMO_SBOM_SUMMARY,
        findings=DEMO_FINDINGS,
    )



def get_demo_chat_response(message: str) -> ChatResponse:
    """Return a mock demo chat response."""
    return ChatResponse(
        answer=(
            f"[RepoLens Demo Mode] You asked: \"{message[:80]}{'...' if len(message) > 80 else ''}\"\n\n"
            "This is the **repolens-demo** repository showcasing paymentService.js analysis.\n\n"
            "Key findings:\n"
            "• **CRITICAL:** Hardcoded payment gateway API secret at line 14 — move to environment variable immediately.\n"
            "• **HIGH:** Circular dependency between `paymentService.js` ↔ `notificationService.js` increases reliability risk.\n"
            "• **Blast radius 72/100:** Changes to `paymentService.js` affect 11 files including 2 API entry points.\n\n"
            "Configure your `GEMINI_API_KEY` for live AI-powered explanations on your own repositories."
        ),
        referenced_files=["src/services/paymentService.js", "src/services/notificationService.js"],
        referenced_findings=["Hardcoded payment gateway API secret", "Circular dependency detected"],
        model_used="demo",
    )
