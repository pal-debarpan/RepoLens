from typing import Any
import networkx as nx

from app.schemas.testing import TestRecommendation, TestingPriority, TestingResponse


def generate_testing_recommendations(
    G: nx.DiGraph,
    blast_scores: dict[str, float],
    scanned_files: list[dict[str, Any]],
    entry_points: list[str],
) -> TestingResponse:
    """
    Generate deterministic testing recommendations based on blast radius, 
    missing test coverage, and entry point impact.
    """
    # Identify existing test files
    existing_test_files = [
        f["rel_path"]
        for f in scanned_files
        if "test" in f["rel_path"].lower() or "spec" in f["rel_path"].lower()
    ]
    test_file_set = set(existing_test_files)

    # Source files without test counterpart
    source_files = [
        f for f in scanned_files
        if f.get("is_code")
        and "test" not in f["rel_path"].lower()
        and "spec" not in f["rel_path"].lower()
    ]

    recommendations: list[TestRecommendation] = []
    seen: set[str] = set()

    for sf in source_files:
        rel_path = sf["rel_path"]
        if rel_path in seen:
            continue
        seen.add(rel_path)

        blast_score = blast_scores.get(rel_path, 0.0)
        is_entry = sf.get("is_entry_point", False)

        # Find the affected entry points transitively
        affected_eps: list[str] = []
        R = G.reverse(copy=False)
        if rel_path in G:
            try:
                reachable = nx.descendants(R, rel_path)
                affected_eps = [ep for ep in reachable if ep in entry_points]
            except Exception:
                affected_eps = []

        # Check for existing test file (heuristic: test_filename.py or filename.test.js, etc.)
        import os
        basename = os.path.splitext(os.path.basename(rel_path))[0]
        has_test = any(
            basename in tf or f"test_{basename}" in tf or f"{basename}.test" in tf or f"{basename}.spec" in tf
            for tf in test_file_set
        )

        reasons: list[str] = []
        suggested_types: list[str] = []

        if blast_score >= 70:
            reasons.append(f"High blast radius score ({blast_score:.0f}/100) — changes propagate widely")
            suggested_types += ["unit", "integration", "regression"]
        elif blast_score >= 40:
            reasons.append(f"Moderate blast radius score ({blast_score:.0f}/100) — upstream impact possible")
            suggested_types += ["unit", "integration"]
        elif blast_score > 5:
            reasons.append(f"Low-to-moderate blast radius ({blast_score:.0f}/100)")
            suggested_types += ["unit"]

        if is_entry:
            reasons.append("Application entry point / API route — direct user-facing surface")
            if "e2e" not in suggested_types:
                suggested_types += ["e2e"]

        if not has_test:
            reasons.append("No corresponding test file detected")

        if len(affected_eps) > 0:
            reasons.append(f"Affects {len(affected_eps)} entry point(s) transitively")

        if not reasons:
            continue

        # Priority assignment
        if blast_score >= 70 or (is_entry and not has_test):
            priority = TestingPriority.HIGH
        elif blast_score >= 35 or len(affected_eps) >= 2:
            priority = TestingPriority.MEDIUM
        else:
            priority = TestingPriority.LOW

        # Suggest a test file path
        import re as _re
        _re_ext = _re.compile(r"\.[^.]+$")
        base_no_ext = _re_ext.sub("", rel_path)
        lang = sf.get("language")
        if lang in {"python"}:
            test_hint = f"tests/test_{basename}.py"
        elif lang in {"javascript", "typescript"}:
            test_hint = f"{base_no_ext}.test.{lang[:2]}s"
        else:
            test_hint = f"tests/{basename}_test"

        recommendations.append(
            TestRecommendation(
                id=f"rec-{len(recommendations)+1:03d}",
                priority=priority,
                target_file=rel_path,
                test_file_hint=test_hint,
                reason=" | ".join(reasons),
                blast_radius_score=blast_score,
                affected_entry_points=sorted(affected_eps[:5]),
                suggested_test_types=list(dict.fromkeys(suggested_types)),
            )
        )

    # Sort by: priority (HIGH first), then blast_radius_score descending
    priority_order = {TestingPriority.HIGH: 0, TestingPriority.MEDIUM: 1, TestingPriority.LOW: 2}
    recommendations.sort(key=lambda r: (priority_order[r.priority], -r.blast_radius_score))

    high_count = sum(1 for r in recommendations if r.priority == TestingPriority.HIGH)

    return TestingResponse(
        total_recommendations=len(recommendations),
        high_priority_count=high_count,
        test_coverage_estimated=None,
        existing_test_files_count=len(existing_test_files),
        recommendations=recommendations,
    )
