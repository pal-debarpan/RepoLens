from uuid import UUID
from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.models.repository import SourceType


class RepositoryBase(BaseModel):
    source_url: str = Field(..., description="The URL of the repository source.")
    user_id: Optional[UUID] = Field(None, description="The owner user ID.")
    name: Optional[str] = Field(None, description="The name or identifier of the repository.")
    default_branch: Optional[str] = None
    primary_language: Optional[str] = None
    description: Optional[str] = None
    latest_commit_sha: Optional[str] = None
    workspace_path: Optional[str] = Field(None, description="Path to local extracted source code.")
    file_count: Optional[int] = Field(None, description="Number of files in the repository.")
    total_size_bytes: Optional[int] = Field(None, description="Total size of the repository in bytes.")


class RepositoryCreate(RepositoryBase):
    source_type: SourceType

    @model_validator(mode='after')
    def validate_github_url(self) -> "RepositoryCreate":
        if self.source_type == SourceType.github:
            if not (self.source_url.startswith("https://github.com/") or self.source_url.startswith("http://github.com/")):
                raise ValueError("GitHub source_url must start with https://github.com/")
        return self


class RepositoryUpdate(BaseModel):
    name: Optional[str] = None
    default_branch: Optional[str] = None
    primary_language: Optional[str] = None
    description: Optional[str] = None
    latest_commit_sha: Optional[str] = None
    workspace_path: Optional[str] = None
    file_count: Optional[int] = None
    total_size_bytes: Optional[int] = None


class GitHubIngestRequest(BaseModel):
    url: Optional[str] = Field(None, description="The GitHub repository URL (e.g., https://github.com/org/repo)")
    source_url: Optional[str] = Field(None, description="The GitHub repository URL (e.g., https://github.com/org/repo)")
    pat: Optional[str] = Field(
        None,
        exclude=True,  # Never serialized — never appears in responses or logs
        description="GitHub Personal Access Token for private repository access. Not stored.",
    )

    @model_validator(mode='after')
    def validate_github_url(self) -> "GitHubIngestRequest":
        target = self.url or self.source_url
        if not target:
            raise ValueError("Either 'url' or 'source_url' must be provided.")
        if not (target.startswith("https://github.com/") or target.startswith("http://github.com/")):
            raise ValueError("GitHub URL must start with https://github.com/")
        self.url = target
        self.source_url = target
        return self


class RepositoryResponse(RepositoryBase):
    id: UUID
    source_type: SourceType
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
