from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field


class TestingPriority(str, Enum):
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"


class TestRecommendation(BaseModel):
    id: str = Field(..., description="Unique recommendation ID")
    priority: TestingPriority
    target_file: str = Field(..., description="Source file requiring test attention")
    test_file_hint: Optional[str] = Field(None, description="Suggested test file path")
    reason: str = Field(..., description="Why testing is recommended (e.g. blast radius, complexity, missing tests)")
    blast_radius_score: float = Field(0.0, description="Blast radius score of target file")
    affected_entry_points: list[str] = Field(default_factory=list, description="Entry points impacted if this file changes")
    suggested_test_types: list[str] = Field(default_factory=list, description="Types of tests: unit, integration, e2e, regression")


class TestingResponse(BaseModel):
    total_recommendations: int
    high_priority_count: int
    test_coverage_estimated: Optional[float] = None
    existing_test_files_count: int = 0
    recommendations: list[TestRecommendation] = Field(default_factory=list)
