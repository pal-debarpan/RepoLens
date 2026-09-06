from typing import Optional, Any
from pydantic import BaseModel, Field


class GraphNode(BaseModel):
    id: str = Field(..., description="Unique node identifier, typically relative file path")
    label: str = Field(..., description="Display label (e.g. filename)")
    path: str = Field(..., description="Full relative path within repository")
    language: Optional[str] = None
    lines_of_code: int = 0
    in_degree: int = 0
    out_degree: int = 0
    is_entry_point: bool = False
    blast_radius_score: Optional[float] = None
    metadata: dict[str, Any] = Field(default_factory=dict)


class GraphEdge(BaseModel):
    source: str = Field(..., description="Source node id (importer/caller)")
    target: str = Field(..., description="Target node id (imported/callee)")
    edge_type: str = Field("imports", description="Relationship type, e.g., 'imports'")
    weight: float = 1.0


class GraphResponse(BaseModel):
    nodes: list[GraphNode] = Field(default_factory=list)
    edges: list[GraphEdge] = Field(default_factory=list)
    total_nodes: int = 0
    total_edges: int = 0
    density: float = 0.0
    has_cycles: bool = False
    cycles: list[list[str]] = Field(default_factory=list)


class FileGraphResponse(BaseModel):
    target_file: str
    depth: int = 2
    upstream_dependencies: list[str] = Field(default_factory=list, description="Files imported by this file")
    downstream_dependents: list[str] = Field(default_factory=list, description="Files that import this file")
    nodes: list[GraphNode] = Field(default_factory=list)
    edges: list[GraphEdge] = Field(default_factory=list)
