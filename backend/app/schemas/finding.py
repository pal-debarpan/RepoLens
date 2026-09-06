from uuid import UUID
from datetime import datetime
from typing import Optional, Any
from pydantic import BaseModel, ConfigDict, Field

from app.models.finding import FindingCategory, FindingSeverity


class FindingBase(BaseModel):
    category: FindingCategory
    severity: FindingSeverity
    title: str = Field(..., description="Short summary of finding")
    description: str = Field(..., description="Detailed explanation of finding")
    file_path: str = Field(..., description="Relative file path in repository")
    line_number: Optional[int] = Field(None, description="Line number if localized")
    evidence: Optional[str] = Field(None, description="Sanitized/masked code snippet")
    suggested_fix: Optional[str] = Field(None, description="Remediation guidance")
    metadata_payload: Optional[dict[str, Any]] = Field(default_factory=dict)


class FindingCreate(FindingBase):
    pass


class FindingResponse(FindingBase):
    id: UUID
    analysis_id: UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class FindingFilterParams(BaseModel):
    category: Optional[FindingCategory] = None
    severity: Optional[FindingSeverity] = None
    file_path: Optional[str] = None
