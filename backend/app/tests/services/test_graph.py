"""Tests for graph service and blast radius engine."""
import networkx as nx
import pytest

from app.services.graph import (
    build_dependency_graph,
    find_graph_cycles,
    get_file_subgraph,
    serialize_graph_response,
)
from app.services.blast_radius import calculate_blast_radius, determine_impact_level
from app.schemas.blast_radius import ImpactLevel


def _build_simple_graph() -> nx.DiGraph:
    """Build a simple test graph: A -> B -> C, A -> D, E -> B (E is entry point)."""
    file_records = [
        {"rel_path": "A.py", "language": "python", "line_count": 100, "is_entry_point": False, "metadata": {}},
        {"rel_path": "B.py", "language": "python", "line_count": 80, "is_entry_point": False, "metadata": {}},
        {"rel_path": "C.py", "language": "python", "line_count": 50, "is_entry_point": False, "metadata": {}},
        {"rel_path": "D.py", "language": "python", "line_count": 40, "is_entry_point": False, "metadata": {}},
        {"rel_path": "E.py", "language": "python", "line_count": 30, "is_entry_point": True, "metadata": {}},
    ]
    resolved_deps = {
        "A.py": ["B.py", "D.py"],
        "B.py": ["C.py"],
        "E.py": ["B.py"],
    }
    return build_dependency_graph(file_records, resolved_deps)


def test_build_graph_nodes():
    G = _build_simple_graph()
    assert "A.py" in G
    assert "B.py" in G
    assert "C.py" in G
    assert "D.py" in G
    assert "E.py" in G


def test_build_graph_edges():
    G = _build_simple_graph()
    assert G.has_edge("A.py", "B.py")
    assert G.has_edge("A.py", "D.py")
    assert G.has_edge("B.py", "C.py")
    assert G.has_edge("E.py", "B.py")


def test_graph_entry_point_attribute():
    G = _build_simple_graph()
    assert G.nodes["E.py"]["is_entry_point"] is True
    assert G.nodes["A.py"]["is_entry_point"] is False


def test_find_graph_cycles_none():
    G = _build_simple_graph()
    cycles = find_graph_cycles(G)
    assert len(cycles) == 0


def test_find_graph_cycles_detected():
    G = nx.DiGraph()
    G.add_nodes_from(["X.py", "Y.py"])
    G.add_edge("X.py", "Y.py")
    G.add_edge("Y.py", "X.py")  # cycle
    cycles = find_graph_cycles(G)
    assert len(cycles) > 0
    cycle_sets = [set(c) for c in cycles]
    assert {"X.py", "Y.py"} in cycle_sets


def test_serialize_graph_response():
    G = _build_simple_graph()
    response = serialize_graph_response(G)
    assert response.total_nodes == 5
    assert response.total_edges == 4
    node_ids = [n.id for n in response.nodes]
    assert "A.py" in node_ids
    assert "E.py" in node_ids


def test_serialize_graph_with_blast_scores():
    G = _build_simple_graph()
    scores = {"C.py": 25.0, "B.py": 55.0}
    response = serialize_graph_response(G, scores)
    nodes_by_id = {n.id: n for n in response.nodes}
    assert nodes_by_id["C.py"].blast_radius_score == 25.0
    assert nodes_by_id["B.py"].blast_radius_score == 55.0
    assert nodes_by_id["A.py"].blast_radius_score is None


# ─── Blast Radius Tests ──────────────────────────────────────────────────────────

def test_blast_radius_central_file():
    """C.py is imported by B.py, B.py by A.py and E.py. Modifying C should affect A, B, E."""
    G = _build_simple_graph()
    result = calculate_blast_radius(G, "C.py", ["A.py", "B.py", "C.py", "D.py", "E.py"])
    assert result.target_file == "C.py"
    affected_paths = [af.file_path for af in result.affected_files]
    assert "B.py" in affected_paths  # direct dependent
    assert "A.py" in affected_paths  # transitive
    assert result.direct_dependents_count >= 1
    assert result.score > 0.0


def test_blast_radius_leaf_file():
    """E.py is imported by nobody — blast radius should be minimal."""
    G = _build_simple_graph()
    # E.py imports B.py, but no file imports E.py -> modifying E.py affects 0 callers
    result = calculate_blast_radius(G, "E.py", ["A.py", "B.py", "C.py", "D.py", "E.py"])
    assert result.total_affected_count == 0
    assert result.score == 0.0


def test_blast_radius_unknown_file():
    G = _build_simple_graph()
    result = calculate_blast_radius(G, "nonexistent.py", ["A.py"])
    assert result.score == 0.0
    assert result.total_affected_count == 0


def test_blast_radius_score_range():
    G = _build_simple_graph()
    for node in G.nodes():
        result = calculate_blast_radius(G, node, list(G.nodes()))
        assert 0.0 <= result.score <= 100.0


def test_impact_level_thresholds():
    assert determine_impact_level(80.0) == ImpactLevel.CRITICAL
    assert determine_impact_level(60.0) == ImpactLevel.HIGH
    assert determine_impact_level(35.0) == ImpactLevel.MEDIUM
    assert determine_impact_level(10.0) == ImpactLevel.LOW


def test_get_file_subgraph():
    G = _build_simple_graph()
    sub = get_file_subgraph(G, "B.py", depth=2)
    assert sub.target_file == "B.py"
    # B imports C → C is upstream dependency
    assert "C.py" in sub.upstream_dependencies
    # A and E import B → they are downstream dependents
    assert "A.py" in sub.downstream_dependents
    assert "E.py" in sub.downstream_dependents
