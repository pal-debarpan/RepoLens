from pydantic import BaseModel, Field

class UmlResponse(BaseModel):
    diagram_type: str = Field(description="The type of the diagram, e.g., 'plantuml'")
    plantuml_source: str = Field(description="The PlantUML string representation of the architecture")
    total_nodes: int = Field(0, description="Total number of architectural nodes")
    total_edges: int = Field(0, description="Total number of architectural relationships")
