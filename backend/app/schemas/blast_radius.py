from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field


class ImpactLevel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class AffectedFile(BaseModel):
    file_path: str
    distance: int = Field(..., description="Shortest path distance from target file")
    impact_score: float = Field(..., ge=0, le=100, description="Weighted impact score (0-100)")
    impact_level: ImpactLevel
    reason: str = Field(..., description="Explanation of dependency or propagation")
    import_chain: list[str] = Field(default_factory=list, description="Chain of files propagating dependency")


class BlastRadiusRequest(BaseModel):
    file_path: str = Field(..., description="Target file path to evaluate blast radius for")
    change_type: Optional[str] = Field("modify", description="Type of change: modify, delete, rename")


class BlastRadiusResponse(BaseModel):
    target_file: str
    score: float = Field(..., ge=0, le=100, description="Overall blast radius score from 0 to 100")
    impact_level: ImpactLevel
    direct_dependents_count: int
    total_affected_count: int
    affected_files: list[AffectedFile] = Field(default_factory=list)
    evidence_chains: list[list[str]] = Field(default_factory=list, description="Top propagation paths")
    test_targets: list[str] = Field(default_factory=list, description="Test files recommended to run")
