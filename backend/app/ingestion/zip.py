import os
import uuid
import zipfile
import shutil
import tempfile
from pathlib import Path
from fastapi import UploadFile

from app.core.config import settings
from app.models.repository import SourceType
from app.ingestion.models import IngestedRepository
from app.ingestion.exceptions import IngestionError, ResourceLimitError, SecurityError
from app.ingestion.github import get_workspace_root, _detect_languages

def _is_safe_path(base_dir: Path, target_path: str) -> bool:
    """Check if the target_path stays within the base_dir to prevent Zip Slip and path traversal."""
    if not target_path or target_path.startswith("/") or target_path.startswith("\\"):
        return False
    # Detect Windows drive letter or stream specifications (e.g. C:, C:\, D:...)
    if ":" in target_path:
        return False
    try:
        resolved_base = base_dir.resolve()
        resolved_target = (base_dir / target_path).resolve()
        return resolved_target.is_relative_to(resolved_base)
    except Exception:
        return False

def _is_symlink(member: zipfile.ZipInfo) -> bool:
    """Check if zip member is a POSIX symbolic link."""
    mode = member.external_attr >> 16
    return (mode & 0o170000) == 0o120000

def ingest_zip_upload(upload_file: UploadFile) -> IngestedRepository:
    """Ingests a ZIP file upload, safely extracts it, and returns metadata."""
    
    # Enforce max upload size limit upfront if available
    if upload_file.size is not None and upload_file.size > settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024:
        raise ResourceLimitError(f"Upload exceeds maximum allowed size of {settings.MAX_UPLOAD_SIZE_MB}MB.")
        
    workspace_id = str(uuid.uuid4())
    workspace_path = get_workspace_root() / workspace_id
    workspace_path.mkdir(parents=True, exist_ok=True)
    
    zip_path = workspace_path / "upload.zip"
    extract_path = workspace_path / "source"
    extract_path.mkdir(parents=True, exist_ok=True)
    
    file_count = 0
    total_size = 0
    max_size = settings.MAX_EXTRACTED_SIZE_MB * 1024 * 1024
    max_file_size = settings.MAX_FILE_SIZE_MB * 1024 * 1024
    
    try:
        # Save upload to temporary file
        with open(zip_path, "wb") as f:
            while chunk := upload_file.file.read(8192):
                f.write(chunk)
                
        # Check ZIP file size after saving
        if zip_path.stat().st_size > settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024:
            raise ResourceLimitError(f"Upload exceeds maximum allowed size of {settings.MAX_UPLOAD_SIZE_MB}MB.")
            
        if not zipfile.is_zipfile(zip_path):
            raise SecurityError("Uploaded file is not a valid ZIP archive.")
            
        with zipfile.ZipFile(zip_path, "r") as zf:
            infolist = zf.infolist()
            if len(infolist) > settings.MAX_ZIP_ENTRIES:
                raise ResourceLimitError(f"ZIP archive contains too many entries (max {settings.MAX_ZIP_ENTRIES}).")
                
            for member in infolist:
                # Security Check: Zip Slip / Path Traversal
                if not _is_safe_path(extract_path, member.filename):
                    raise SecurityError(f"Unsafe path in ZIP archive detected: {member.filename}")
                    
                # Security Check: Symbolic Links
                if _is_symlink(member):
                    raise SecurityError(f"Symlinks in ZIP archive are not allowed: {member.filename}")

                # Resource Check: Single file size
                if member.file_size > max_file_size:
                    raise ResourceLimitError(f"File {member.filename} in ZIP exceeds single file size limit.")
                    
                total_size += member.file_size
                if total_size > max_size:
                    raise ResourceLimitError(f"Extracted ZIP exceeds total size limit of {settings.MAX_EXTRACTED_SIZE_MB}MB.")
                    
                if not member.is_dir():
                    file_count += 1
                    
                # Extract file safely
                zf.extract(member, extract_path)
                
        # Clean up the temporary zip archive file
        zip_path.unlink(missing_ok=True)
        
        filename = upload_file.filename or "upload.zip"
        source_url = f"zip://{filename}"
        primary_lang, languages = _detect_languages(extract_path)
        
        return IngestedRepository(
            source_type=SourceType.zip,
            source_url=source_url,
            repository_name=filename,
            default_branch="main",
            primary_language=primary_lang,
            languages=languages,
            workspace_path=str(extract_path),
            file_count=file_count,
            total_size_bytes=total_size,
            ingestion_status="completed"
        )
        
    except zipfile.BadZipFile:
        shutil.rmtree(workspace_path, ignore_errors=True)
        raise SecurityError("Failed to extract: Bad ZIP file.")
    except IngestionError:
        shutil.rmtree(workspace_path, ignore_errors=True)
        raise
    except Exception as e:
        shutil.rmtree(workspace_path, ignore_errors=True)
        raise IngestionError(f"Unexpected error during ZIP ingestion: {e}")
