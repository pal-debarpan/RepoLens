import math
from typing import Any
import networkx as nx

from app.schemas.blast_radius import AffectedFile, BlastRadiusResponse, ImpactLevel


def determine_impact_level(score: float) -> ImpactLevel:
    if score >= 76.0:
        return ImpactLevel.CRITICAL
    elif score >= 51.0:
        return ImpactLevel.HIGH
    elif score >= 26.0:
        return ImpactLevel.MEDIUM
    return ImpactLevel.LOW


def calculate_blast_radius(
    G: nx.DiGraph,
    target_file: str,
    all_files: list[str] | None = None,
) -> BlastRadiusResponse:
    """
    Calculate deterministic 0-100 blast radius score and affected files for a given target file.
    In G, edge (u, v) represents u imports v.
    Therefore, dependents that are affected when target_file changes are reachable
    in the reversed graph R = G.reverse().
    """
    total_repo_files = len(all_files) if all_files else max(len(G), 1)

    if target_file not in G:
        return BlastRadiusResponse(
            target_file=target_file,
            score=0.0,
            impact_level=ImpactLevel.LOW,
            direct_dependents_count=0,
            total_affected_count=0,
            affected_files=[],
            evidence_chains=[],
            test_targets=[],
        )

    # Reverse graph: edges point from imported file to importer file
    R = G.reverse(copy=True)

    # Find shortest paths from target_file to all dependent files
    try:
        paths = nx.single_source_shortest_path(R, target_file)
    except Exception:
        paths = {target_file: [target_file]}

    # Remove target_file itself from dependents
    paths.pop(target_file, None)

    direct_dependents_count = 0
    raw_impact_sum = 0.0
    affected_files_list: list[AffectedFile] = []
    evidence_chains: list[list[str]] = []
    test_targets: list[str] = []

    for dep_file, path in paths.items():
        dist = len(path) - 1
        is_direct = (dist == 1)
        if is_direct:
            direct_dependents_count += 1

        node_data = G.nodes.get(dep_file, {})
        is_entry = node_data.get("is_entry_point", False)

        # Distance decay: distance 1 => 1.0, distance 2 => 0.55, distance 3 => 0.38
        distance_weight = 1.0 / (dist ** 0.8)
        entry_multiplier = 1.6 if is_entry else 1.0

        item_impact = min(100.0, (100.0 / dist) * (1.2 if is_entry else 0.9))
        raw_impact_sum += distance_weight * entry_multiplier

        # Determine if test file
        is_test = "test" in dep_file.lower() or "spec" in dep_file.lower()
        if is_test:
            test_targets.append(dep_file)

        reason = (
            "Directly imports this file"
            if is_direct
            else f"Transitively depends on this file (step {dist} via {' -> '.join(path[1:-1])})"
        )
        if is_entry:
            reason += " [High Impact: Application Entry Point / API Route]"

        affected_files_list.append(
            AffectedFile(
                file_path=dep_file,
                distance=dist,
                impact_score=round(item_impact, 1),
                impact_level=determine_impact_level(item_impact),
                reason=reason,
                import_chain=path,
            )
        )

        if len(evidence_chains) < 10:
            evidence_chains.append(path)

    # Sort affected files by distance ascending, then impact_score descending
    affected_files_list.sort(key=lambda x: (x.distance, -x.impact_score))

    # Overall 0-100 Score normalization
    # Formula factors:
    # 1. Proportion of repository affected
    # 2. Number of direct dependents
    # 3. Ratio of entry points impacted
    affected_count = len(affected_files_list)
    if affected_count == 0:
        overall_score = 0.0
    else:
        repo_ratio = affected_count / max(total_repo_files, 1)
        direct_ratio = direct_dependents_count / max(affected_count, 1)
        entry_count = sum(1 for f in affected_files_list if "Entry Point" in f.reason)
        entry_ratio = (entry_count / affected_count) if affected_count > 0 else 0

        # Weighted calculation
        # Base factor: 20
        # Reach factor: up to 45
        # Direct impact factor: up to 20
        # Entry point risk factor: up to 15
        reach_component = min(45.0, (affected_count * 5.0) + (repo_ratio * 25.0))
        direct_component = min(20.0, direct_dependents_count * 4.0)
        entry_component = min(20.0, entry_count * 6.0)
        base_component = 15.0

        overall_score = min(100.0, max(5.0, base_component + reach_component + direct_component + entry_component))

    overall_score = round(overall_score, 1)
    impact_level = determine_impact_level(overall_score)

    return BlastRadiusResponse(
        target_file=target_file,
        score=overall_score,
        impact_level=impact_level,
        direct_dependents_count=direct_dependents_count,
        total_affected_count=affected_count,
        affected_files=affected_files_list,
        evidence_chains=evidence_chains,
        test_targets=sorted(test_targets),
    )


def compute_all_blast_scores(G: nx.DiGraph, all_files: list[str]) -> dict[str, float]:
    """
    Precompute blast radius scores for all files in graph.
    """
    scores: dict[str, float] = {}
    for node in G.nodes():
        res = calculate_blast_radius(G, node, all_files)
        scores[node] = res.score
    return scores
