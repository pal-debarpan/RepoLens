import os
import re
import uuid
import shutil
import tempfile
import subprocess
from pathlib import Path
from typing import Tuple, Optional, Dict

from app.core.config import settings
from app.models.repository import SourceType
from app.ingestion.models import IngestedRepository
from app.ingestion.exceptions import IngestionError, ResourceLimitError, SecurityError

GITHUB_URL_REGEX = re.compile(r"^https://github\.com/([\w.-]+)/([\w.-]+?)(?:\.git)?$")

EXTENSION_LANGUAGE_MAP = {
    ".py": "Python",
    ".js": "JavaScript",
    ".jsx": "JavaScript",
    ".ts": "TypeScript",
    ".tsx": "TypeScript",
    ".go": "Go",
    ".rs": "Rust",
    ".java": "Java",
    ".cpp": "C++",
    ".c": "C",
    ".h": "C",
    ".cs": "C#",
    ".php": "PHP",
    ".rb": "Ruby",
    ".html": "HTML",
    ".css": "CSS",
    ".sql": "SQL",
    ".sh": "Shell",
    ".kt": "Kotlin",
    ".swift": "Swift",
}

def get_workspace_root() -> Path:
    if settings.INGESTION_WORKSPACE_ROOT:
        path = Path(settings.INGESTION_WORKSPACE_ROOT)
        path.mkdir(parents=True, exist_ok=True)
        return path
    return Path(tempfile.gettempdir())

def _calculate_repo_stats(workspace_path: Path) -> Tuple[int, int]:
    """Calculate file count and total size, enforcing resource limits."""
    file_count = 0
    total_size = 0
    max_size = settings.MAX_EXTRACTED_SIZE_MB * 1024 * 1024

    for root, dirs, files in os.walk(workspace_path):
        # Skip .git directory
        if '.git' in dirs:
            dirs.remove('.git')
            
        for file in files:
            file_path = Path(root) / file
            
            # Skip symlinks for security and simplicity
            if file_path.is_symlink():
                continue
                
            file_count += 1
            if file_count > settings.MAX_ZIP_ENTRIES:
                raise ResourceLimitError(f"Repository exceeds maximum file count limit of {settings.MAX_ZIP_ENTRIES}")
                
            try:
                size = file_path.stat().st_size
                if size > settings.MAX_FILE_SIZE_MB * 1024 * 1024:
                    raise ResourceLimitError(f"File {file} exceeds single file size limit.")
                total_size += size
                if total_size > max_size:
                    raise ResourceLimitError(f"Repository exceeds total size limit of {settings.MAX_EXTRACTED_SIZE_MB}MB.")
            except OSError as e:
                raise IngestionError(f"Error reading file stats: {e}")

    return file_count, total_size

def _detect_languages(workspace_path: Path) -> Tuple[Optional[str], Optional[Dict[str, int]]]:
    """Detect language breakdown by file extensions."""
    counts: Dict[str, int] = {}
    for root, dirs, files in os.walk(workspace_path):
        if '.git' in dirs:
            dirs.remove('.git')
        for f in files:
            ext = Path(f).suffix.lower()
            if ext in EXTENSION_LANGUAGE_MAP:
                lang = EXTENSION_LANGUAGE_MAP[ext]
                counts[lang] = counts.get(lang, 0) + 1
    if not counts:
        return None, None
    primary = max(counts, key=counts.get)
    return primary, counts

def _get_default_branch(workspace_path: Path) -> str:
    """Attempt to read the default branch from .git/HEAD."""
    head_path = workspace_path / ".git" / "HEAD"
    if head_path.exists():
        try:
            content = head_path.read_text().strip()
            if content.startswith("ref: refs/heads/"):
                return content.split("/")[-1]
        except Exception:
            pass
    return "main"

def ingest_github_repo(url: str) -> IngestedRepository:
    """Clones a GitHub repository to a temporary workspace and returns metadata."""
    match = GITHUB_URL_REGEX.match(url)
    if not match:
        raise SecurityError("Invalid GitHub URL format.")
    
    owner, repo_name = match.groups()
    repo_full_name = f"{owner}/{repo_name}"
    
    workspace_id = str(uuid.uuid4())
    workspace_path = get_workspace_root() / workspace_id
    workspace_path.mkdir(parents=True, exist_ok=True)
    
    try:
        # Clone the repository
        # We only fetch depth 1 to save time/bandwidth
        result = subprocess.run(
            ["git", "clone", "--depth", "1", url, str(workspace_path)],
            capture_output=True,
            text=True,
            timeout=settings.INGESTION_TIMEOUT_SECONDS
        )
        
        if result.returncode != 0:
            shutil.rmtree(workspace_path, ignore_errors=True)
            stderr = (result.stderr or "").lower()
            if "not found" in stderr or "could not resolve" in stderr or "404" in stderr:
                raise IngestionError("Repository not found or is private.")
            raise IngestionError("Git clone failed for repository.")
            
        file_count, total_size = _calculate_repo_stats(workspace_path)
        default_branch = _get_default_branch(workspace_path)
        primary_lang, languages = _detect_languages(workspace_path)
        
        return IngestedRepository(
            source_type=SourceType.github,
            source_url=url,
            repository_name=repo_full_name,
            default_branch=default_branch,
            primary_language=primary_lang,
            languages=languages,
            workspace_path=str(workspace_path),
            file_count=file_count,
            total_size_bytes=total_size,
            ingestion_status="completed"
        )
        
    except subprocess.TimeoutExpired:
        shutil.rmtree(workspace_path, ignore_errors=True)
        raise ResourceLimitError(f"Git clone timed out after {settings.INGESTION_TIMEOUT_SECONDS}s.")
    except Exception as e:
        shutil.rmtree(workspace_path, ignore_errors=True)
        if not isinstance(e, IngestionError):
            raise IngestionError("Unexpected error during ingestion.")
        raise
