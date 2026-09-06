from typing import Any
import networkx as nx

from app.models.finding import FindingCategory, FindingSeverity
from app.schemas.finding import FindingCreate
from app.services.graph import find_graph_cycles


def analyze_architecture(
    G: nx.DiGraph,
    scanned_files: list[dict[str, Any]],
) -> list[FindingCreate]:
    """
    Detect architectural anti-patterns:
    - Circular dependencies
    - High fan-in (central bottleneck)
    - High fan-out (excessive outward coupling)
    - Monolithic modules (>500 lines)
    """
    findings: list[FindingCreate] = []

    # 1. Circular dependencies
    cycles = find_graph_cycles(G, max_cycles=10)
    seen_cycle_files = set()
    for cycle in cycles:
        cycle_str = " -> ".join(cycle + [cycle[0]])
        # Report for each file involved in cycle, but avoid excessive duplicates
        for f in cycle:
            if f not in seen_cycle_files:
                seen_cycle_files.add(f)
                findings.append(
                    FindingCreate(
                        category=FindingCategory.ARCHITECTURE,
                        severity=FindingSeverity.HIGH,
                        title=f"Circular dependency detected involving {f}",
                        description=f"File is part of a circular dependency cycle: {cycle_str}. Circular dependencies complicate testing, refactoring, and can cause runtime initialization bugs.",
                        file_path=f,
                        line_number=1,
                        evidence=cycle_str,
                        suggested_fix="Refactor shared functions into a separate intermediary utility module or apply dependency inversion.",
                        metadata_payload={"cycle": cycle},
                    )
                )

    # 2. High Fan-In (Bottleneck / Core Hotspot)
    for node in G.nodes():
        in_degree = G.in_degree(node)
        # If imported by 6 or more files
        if in_degree >= 6:
            findings.append(
                FindingCreate(
                    category=FindingCategory.ARCHITECTURE,
                    severity=FindingSeverity.MEDIUM,
                    title=f"High architectural fan-in on {node} ({in_degree} dependents)",
                    description=f"This module is imported by {in_degree} distinct files. Changes to this interface carry a high propagation risk across the codebase.",
                    file_path=node,
                    line_number=1,
                    evidence=f"In-degree: {in_degree} callers",
                    suggested_fix="Ensure this module maintains strict public interface contracts and comprehensive unit test coverage.",
                    metadata_payload={"in_degree": in_degree},
                )
            )

    # 3. High Fan-Out (Tight Coupling)
    for node in G.nodes():
        out_degree = G.out_degree(node)
        if out_degree >= 10:
            findings.append(
                FindingCreate(
                    category=FindingCategory.ARCHITECTURE,
                    severity=FindingSeverity.MEDIUM,
                    title=f"Excessive coupling / high fan-out in {node} ({out_degree} imports)",
                    description=f"This module directly depends on {out_degree} internal files. High fan-out makes modules brittle and prone to cascading changes.",
                    file_path=node,
                    line_number=1,
                    evidence=f"Out-degree: {out_degree} dependencies",
                    suggested_fix="Decompose into cohesive submodules or delegate responsibilities using facades.",
                    metadata_payload={"out_degree": out_degree},
                )
            )

    # 4. Monolithic modules (>500 lines)
    for sf in scanned_files:
        lines = sf.get("line_count", 0)
        rel_path = sf.get("rel_path", "")
        if lines > 500:
            findings.append(
                FindingCreate(
                    category=FindingCategory.ARCHITECTURE,
                    severity=FindingSeverity.LOW if lines < 1000 else FindingSeverity.MEDIUM,
                    title=f"Large monolithic file ({lines} lines)",
                    description=f"File {rel_path} has {lines} lines of code. Large files often violate the Single Responsibility Principle and increase maintenance friction.",
                    file_path=rel_path,
                    line_number=1,
                    evidence=f"Total lines: {lines}",
                    suggested_fix="Break down file into smaller domain-specific modules or utility classes.",
                    metadata_payload={"line_count": lines},
                )
            )

    return findings
