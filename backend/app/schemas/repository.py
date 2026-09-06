from uuid import UUID
from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.models.repository import SourceType


class RepositoryBase(BaseModel):
    source_url: str = Field(..., description="The URL of the repository source.")
    name: Optional[str] = Field(None, description="The name or identifier of the repository.")
    default_branch: Optional[str] = None
    primary_language: Optional[str] = None
    description: Optional[str] = None
    latest_commit_sha: Optional[str] = None


class RepositoryCreate(RepositoryBase):
    source_type: SourceType

    @model_validator(mode='after')
    def validate_github_url(self) -> "RepositoryCreate":
        if self.source_type == SourceType.github:
            if not self.source_url.startswith("https://github.com/"):
                raise ValueError("GitHub source_url must start with https://github.com/")
        return self


class RepositoryUpdate(BaseModel):
    name: Optional[str] = None
    default_branch: Optional[str] = None
    primary_language: Optional[str] = None
    description: Optional[str] = None
    latest_commit_sha: Optional[str] = None


class RepositoryResponse(RepositoryBase):
    id: UUID
    source_type: SourceType
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
