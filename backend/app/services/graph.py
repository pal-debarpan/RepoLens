from pathlib import PurePosixPath
from typing import Any
import networkx as nx

from app.schemas.graph import GraphEdge, GraphNode, GraphResponse, FileGraphResponse


def build_dependency_graph(
    file_records: list[dict[str, Any]],
    resolved_dependencies: dict[str, list[str]],
) -> nx.DiGraph:
    """
    Build a NetworkX directed graph where an edge (u, v) denotes that u imports v.
    """
    G = nx.DiGraph()

    # Add all files as nodes
    for rec in file_records:
        rel_path = rec["rel_path"]
        G.add_node(
            rel_path,
            label=PurePosixPath(rel_path).name,
            path=rel_path,
            language=rec.get("language"),
            lines_of_code=rec.get("line_count", 0),
            is_entry_point=rec.get("is_entry_point", False),
            metadata=rec.get("metadata", {}),
        )

    # Add edges for local imports
    for source_file, targets in resolved_dependencies.items():
        if source_file not in G:
            G.add_node(
                source_file,
                label=PurePosixPath(source_file).name,
                path=source_file,
                language=None,
                lines_of_code=0,
                is_entry_point=False,
                metadata={},
            )
        for target_file in targets:
            if target_file not in G:
                G.add_node(
                    target_file,
                    label=PurePosixPath(target_file).name,
                    path=target_file,
                    language=None,
                    lines_of_code=0,
                    is_entry_point=False,
                    metadata={},
                )
            G.add_edge(source_file, target_file, edge_type="imports", weight=1.0)

    return G


def find_graph_cycles(G: nx.DiGraph, max_cycles: int = 25) -> list[list[str]]:
    """
    Find circular dependency cycles in the graph safely.
    """
    try:
        cycles_gen = nx.simple_cycles(G)
        cycles: list[list[str]] = []
        for c in cycles_gen:
            cycles.append(c)
            if len(cycles) >= max_cycles:
                break
        return cycles
    except Exception:
        return []


def serialize_graph_response(
    G: nx.DiGraph,
    blast_scores: dict[str, float] | None = None,
) -> GraphResponse:
    """
    Convert a NetworkX graph into serializable GraphResponse schema.
    """
    blast_scores = blast_scores or {}
    nodes: list[GraphNode] = []
    edges: list[GraphEdge] = []

    for n, data in G.nodes(data=True):
        nodes.append(
            GraphNode(
                id=n,
                label=data.get("label", PurePosixPath(n).name),
                path=data.get("path", n),
                language=data.get("language"),
                lines_of_code=data.get("lines_of_code", 0),
                in_degree=G.in_degree(n),
                out_degree=G.out_degree(n),
                is_entry_point=data.get("is_entry_point", False),
                blast_radius_score=blast_scores.get(n),
                metadata=data.get("metadata", {}),
            )
        )

    for u, v, edata in G.edges(data=True):
        edges.append(
            GraphEdge(
                source=u,
                target=v,
                edge_type=edata.get("edge_type", "imports"),
                weight=float(edata.get("weight", 1.0)),
            )
        )

    cycles = find_graph_cycles(G)
    density = round(nx.density(G), 4) if len(G) > 1 else 0.0

    return GraphResponse(
        nodes=nodes,
        edges=edges,
        total_nodes=len(nodes),
        total_edges=len(edges),
        density=density,
        has_cycles=len(cycles) > 0,
        cycles=cycles,
    )


def get_file_subgraph(
    G: nx.DiGraph,
    target_file: str,
    depth: int = 2,
    blast_scores: dict[str, float] | None = None,
) -> FileGraphResponse:
    """
    Extract upstream dependencies and downstream dependents for a specific file up to a given depth.
    """
    blast_scores = blast_scores or {}

    if target_file not in G:
        return FileGraphResponse(
            target_file=target_file,
            depth=depth,
            upstream_dependencies=[],
            downstream_dependents=[],
            nodes=[],
            edges=[],
        )

    # In G, u -> v means u imports v.
    # Downstream dependents = files that import target_file (predecessors in G)
    # Upstream dependencies = files that target_file imports (successors in G)
    R = G.reverse(copy=False)

    # Downstream dependents via BFS on reverse graph
    downstream = set()
    for d_node, dist in nx.single_source_shortest_path_length(R, target_file, cutoff=depth).items():
        if d_node != target_file:
            downstream.add(d_node)

    # Upstream dependencies via BFS on forward graph
    upstream = set()
    for u_node, dist in nx.single_source_shortest_path_length(G, target_file, cutoff=depth).items():
        if u_node != target_file:
            upstream.add(u_node)

    subgraph_nodes = {target_file} | upstream | downstream
    sub_G = G.subgraph(subgraph_nodes)

    sub_nodes: list[GraphNode] = []
    for n in sub_G.nodes():
        data = G.nodes[n]
        sub_nodes.append(
            GraphNode(
                id=n,
                label=data.get("label", PurePosixPath(n).name),
                path=data.get("path", n),
                language=data.get("language"),
                lines_of_code=data.get("lines_of_code", 0),
                in_degree=G.in_degree(n),
                out_degree=G.out_degree(n),
                is_entry_point=data.get("is_entry_point", False),
                blast_radius_score=blast_scores.get(n),
                metadata=data.get("metadata", {}),
            )
        )

    sub_edges: list[GraphEdge] = [
        GraphEdge(
            source=u,
            target=v,
            edge_type=edata.get("edge_type", "imports"),
            weight=float(edata.get("weight", 1.0)),
        )
        for u, v, edata in sub_G.edges(data=True)
    ]

    return FileGraphResponse(
        target_file=target_file,
        depth=depth,
        upstream_dependencies=sorted(list(upstream)),
        downstream_dependents=sorted(list(downstream)),
        nodes=sub_nodes,
        edges=sub_edges,
    )
