"""
Ingestion service entrypoint and aliases.
Provides GITHUB_URL_REGEX and unified ingestion helpers.
"""
from app.ingestion.github import GITHUB_URL_REGEX, ingest_github_repo
from app.ingestion.zip import ingest_zip_upload
from app.ingestion.models import IngestedRepository
from app.ingestion.exceptions import IngestionError, SecurityError, ResourceLimitError

__all__ = [
    "GITHUB_URL_REGEX",
    "ingest_github_repo",
    "ingest_zip_upload",
    "IngestedRepository",
    "IngestionError",
    "SecurityError",
    "ResourceLimitError",
]
