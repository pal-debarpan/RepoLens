from uuid import UUID
from datetime import datetime
from typing import Optional, Any
from pydantic import BaseModel, ConfigDict, Field

from app.models.analysis import AnalysisStatus
from app.schemas.finding import FindingResponse
from app.schemas.graph import GraphResponse
from app.schemas.quality import QualityResponse
from app.schemas.testing import TestingResponse
from app.schemas.vulnerability import VulnerabilitiesResponse
from app.schemas.sbom import SbomSummaryResponse


class AnalysisCreate(BaseModel):
    repository_id: UUID = Field(..., description="ID of repository to analyze")
    commit_sha: Optional[str] = Field(None, description="Optional specific commit SHA")


class AnalysisSummary(BaseModel):
    total_files: int = 0
    total_lines: int = 0
    total_findings: int = 0
    findings_by_category: dict[str, int] = Field(default_factory=dict)
    findings_by_severity: dict[str, int] = Field(default_factory=dict)
    blast_radius_summary: dict[str, Any] = Field(default_factory=dict)
    quality_score: Optional[float] = None
    quality_grade: Optional[str] = None
    sbom_component_count: int = 0


class AnalysisResponse(BaseModel):
    id: UUID
    repository_id: UUID
    user_id: Optional[UUID] = None
    status: AnalysisStatus
    error_message: Optional[str] = None
    commit_sha: Optional[str] = None
    file_count: int = 0
    total_lines: int = 0
    primary_language: Optional[str] = None
    quality_score: Optional[float] = None
    blast_radius_max: Optional[float] = None
    blast_radius_avg: Optional[float] = None
    summary: Optional[dict[str, Any]] = None
    created_at: datetime
    completed_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class AnalysisDetailResponse(AnalysisResponse):
    graph: Optional[GraphResponse] = None
    quality: Optional[QualityResponse] = None
    testing: Optional[TestingResponse] = None
    vulnerabilities: Optional[VulnerabilitiesResponse] = None
    sbom: Optional[SbomSummaryResponse] = None
    findings: list[FindingResponse] = Field(default_factory=list)

