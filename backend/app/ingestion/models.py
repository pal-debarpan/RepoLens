from typing import Optional, Dict
from pydantic import BaseModel, ConfigDict
from app.models.repository import SourceType

class IngestedRepository(BaseModel):
    source_type: SourceType
    source_url: str
    repository_name: Optional[str] = None
    default_branch: Optional[str] = None
    primary_language: Optional[str] = None
    languages: Optional[Dict[str, int]] = None
    workspace_path: str
    file_count: int
    total_size_bytes: int
    ingestion_status: str = "completed"

    @property
    def total_size(self) -> int:
        return self.total_size_bytes

    model_config = ConfigDict(from_attributes=True)
