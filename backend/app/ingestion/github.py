import os
import re
import uuid
import shutil
import logging
import tempfile
import subprocess
from pathlib import Path
from typing import Tuple, Optional, Dict

import httpx

from app.core.config import settings
from app.models.repository import SourceType
from app.ingestion.models import IngestedRepository
from app.ingestion.exceptions import IngestionError, ResourceLimitError, SecurityError

logger = logging.getLogger(__name__)

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
        if ".git" in dirs:
            dirs.remove(".git")

        for file in files:
            file_path = Path(root) / file

            # Skip symlinks for security and simplicity
            if file_path.is_symlink():
                continue

            file_count += 1
            if file_count > settings.MAX_ZIP_ENTRIES:
                raise ResourceLimitError(
                    f"Repository exceeds maximum file count limit of {settings.MAX_ZIP_ENTRIES}"
                )

            try:
                size = file_path.stat().st_size
                if size > settings.MAX_FILE_SIZE_MB * 1024 * 1024:
                    raise ResourceLimitError(f"File {file} exceeds single file size limit.")
                total_size += size
                if total_size > max_size:
                    raise ResourceLimitError(
                        f"Repository exceeds total size limit of {settings.MAX_EXTRACTED_SIZE_MB}MB."
                    )
            except OSError as e:
                raise IngestionError(f"Error reading file stats: {e}")

    return file_count, total_size


def _detect_languages(workspace_path: Path) -> Tuple[Optional[str], Optional[Dict[str, int]]]:
    """Detect language breakdown by file extensions."""
    counts: Dict[str, int] = {}
    for root, dirs, files in os.walk(workspace_path):
        if ".git" in dirs:
            dirs.remove(".git")
        for f in files:
            ext = Path(f).suffix.lower()
            if ext in EXTENSION_LANGUAGE_MAP:
                lang = EXTENSION_LANGUAGE_MAP[ext]
                counts[lang] = counts.get(lang, 0) + 1
    if not counts:
        return None, None
    primary = max(counts, key=counts.get)  # type: ignore[arg-type]
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


def _check_github_repo_access(owner: str, repo_name: str, pat: Optional[str]) -> dict:
    """
    Pre-check repository visibility via the GitHub API before cloning.

    - If the repo is public → returns the API response dict.
    - If the repo is private and a valid PAT is supplied → returns the API response dict.
    - If the repo is private and no PAT is supplied → raises SecurityError.
    - If the repo does not exist → raises IngestionError.

    The PAT is used only for this request and is never logged or stored.
    """
    headers = {
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        # User-Agent is required by GitHub API
        "User-Agent": "RepoLens/1.0",
    }
    if pat:
        # Sanitise: strip surrounding whitespace to avoid header injection
        headers["Authorization"] = f"token {pat.strip()}"

    api_url = f"https://api.github.com/repos/{owner}/{repo_name}"

    try:
        with httpx.Client(timeout=15.0) as client:
            response = client.get(api_url, headers=headers)
    except httpx.RequestError as exc:
        raise IngestionError(f"Could not reach GitHub API: {exc}") from exc

    if response.status_code == 200:
        return response.json()

    if response.status_code in (401, 403):
        # PAT was supplied but is invalid / lacks permissions
        raise SecurityError(
            "The provided GitHub token is invalid or does not have access to this repository."
        )

    if response.status_code == 404:
        if not pat:
            # Could be private or non-existent — give a helpful message without leaking which
            raise SecurityError(
                "Repository not found or is private. "
                "Private repositories require a GitHub Personal Access Token (PAT)."
            )
        # PAT was supplied but repo still 404 → genuinely does not exist
        raise IngestionError("Repository not found. Check the URL and try again.")

    # Any other unexpected status
    raise IngestionError(
        f"GitHub API returned an unexpected status ({response.status_code}). Please try again."
    )


def _build_clone_url(url: str, pat: Optional[str]) -> str:
    """
    Embed the PAT into the clone URL for authenticated clones.
    The PAT is only used for the git subprocess call — not stored or logged.
    """
    if not pat:
        return url
    # Insert `token:<pat>@` after `https://`
    return url.replace("https://", f"https://token:{pat.strip()}@", 1)


def ingest_github_repo(url: str, pat: Optional[str] = None) -> IngestedRepository:
    """
    Clones a GitHub repository to a temporary workspace and returns metadata.

    Access control:
      - Public repos: no PAT required.
      - Private repos: a PAT must be supplied; the API is checked before cloning.
      - The PAT is NEVER stored in the database or written to logs.
    """
    match = GITHUB_URL_REGEX.match(url)
    if not match:
        raise SecurityError("Invalid GitHub URL format.")

    owner, repo_name = match.groups()
    repo_full_name = f"{owner}/{repo_name}"

    # ── Security gate: verify access via GitHub API before touching git ──────
    repo_meta = _check_github_repo_access(owner, repo_name, pat)
    is_private: bool = repo_meta.get("private", False)
    description: Optional[str] = repo_meta.get("description")
    default_branch_api: Optional[str] = repo_meta.get("default_branch")

    # Extra guard: if GitHub says private but no PAT was given (shouldn't reach
    # here due to 404 path above, but be explicit)
    if is_private and not pat:
        raise SecurityError(
            "This is a private repository. A GitHub Personal Access Token is required."
        )

    workspace_id = str(uuid.uuid4())
    workspace_path = get_workspace_root() / workspace_id
    workspace_path.mkdir(parents=True, exist_ok=True)

    # Build clone URL — embeds PAT for private repos, plain URL for public
    clone_url = _build_clone_url(url, pat if is_private else None)

    try:
        result = subprocess.run(
            ["git", "clone", "--depth", "1", clone_url, str(workspace_path)],
            capture_output=True,
            text=True,
            timeout=settings.INGESTION_TIMEOUT_SECONDS,
            # Never log the clone URL (may contain embedded PAT)
            env={**os.environ, "GIT_TERMINAL_PROMPT": "0"},
        )

        if result.returncode != 0:
            shutil.rmtree(workspace_path, ignore_errors=True)
            stderr = (result.stderr or "").lower()
            if "not found" in stderr or "could not resolve" in stderr or "404" in stderr:
                raise IngestionError("Repository not found or access was denied.")
            raise IngestionError("Git clone failed. Please check the URL and try again.")

        file_count, total_size = _calculate_repo_stats(workspace_path)
        default_branch = default_branch_api or _get_default_branch(workspace_path)
        primary_lang, languages = _detect_languages(workspace_path)

        return IngestedRepository(
            source_type=SourceType.github,
            source_url=url,  # Store canonical URL — never the PAT-embedded one
            repository_name=repo_full_name,
            default_branch=default_branch,
            primary_language=primary_lang,
            languages=languages,
            description=description,
            workspace_path=str(workspace_path),
            file_count=file_count,
            total_size_bytes=total_size,
            ingestion_status="completed",
        )

    except subprocess.TimeoutExpired:
        shutil.rmtree(workspace_path, ignore_errors=True)
        raise ResourceLimitError(
            f"Git clone timed out after {settings.INGESTION_TIMEOUT_SECONDS}s."
        )
    except Exception as e:
        shutil.rmtree(workspace_path, ignore_errors=True)
        if not isinstance(e, (IngestionError, SecurityError, ResourceLimitError)):
            logger.exception("Unexpected error during GitHub ingestion")
            raise IngestionError("Unexpected error during ingestion.")
        raise
