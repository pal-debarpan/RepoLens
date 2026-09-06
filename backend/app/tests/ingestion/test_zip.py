import pytest
import zipfile
import io
import tempfile
from pathlib import Path
from unittest.mock import patch, MagicMock

from fastapi import UploadFile
from app.ingestion.zip import ingest_zip_upload, _is_safe_path
from app.ingestion.exceptions import SecurityError, ResourceLimitError

def create_in_memory_upload_file(filename: str, content_dict: dict) -> UploadFile:
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, "a", zipfile.ZIP_DEFLATED, False) as zip_file:
        for name, data in content_dict.items():
            zip_file.writestr(name, data)
    
    zip_buffer.seek(0)
    upload_file = MagicMock(spec=UploadFile)
    upload_file.filename = filename
    upload_file.size = len(zip_buffer.getvalue())
    upload_file.file = zip_buffer
    return upload_file

def test_is_safe_path():
    base = Path("/tmp/base")
    assert _is_safe_path(base, "file.txt")
    assert _is_safe_path(base, "folder/file.txt")
    assert not _is_safe_path(base, "../file.txt")
    assert not _is_safe_path(base, "..\\file.txt")
    assert not _is_safe_path(base, "/etc/passwd")
    assert not _is_safe_path(base, "C:\\Windows\\System32")
    assert not _is_safe_path(base, "C:file.txt")

def test_ingest_zip_success():
    upload_file = create_in_memory_upload_file("test.zip", {
        "file1.py": b"print('hello')",
        "folder/file2.txt": b"world",
    })
    
    repo = ingest_zip_upload(upload_file)
    assert repo.source_url == "zip://test.zip"
    assert repo.file_count == 2
    assert repo.total_size_bytes == 19
    assert repo.primary_language == "Python"
    
def test_ingest_zip_exceeds_upload_size():
    upload_file = MagicMock(spec=UploadFile)
    upload_file.filename = "big.zip"
    upload_file.size = 100 * 1024 * 1024
    
    with pytest.raises(ResourceLimitError, match="Upload exceeds maximum allowed size"):
        ingest_zip_upload(upload_file)

def test_ingest_zip_corrupt():
    zip_buffer = io.BytesIO(b"not a valid zip file content")
    upload_file = MagicMock(spec=UploadFile)
    upload_file.filename = "corrupt.zip"
    upload_file.size = len(zip_buffer.getvalue())
    upload_file.file = zip_buffer

    with pytest.raises(SecurityError, match="Uploaded file is not a valid ZIP archive"):
        ingest_zip_upload(upload_file)

def test_ingest_zip_slip_relative():
    upload_file = create_in_memory_upload_file("evil.zip", {
        "../escaped.txt": b"evil",
    })
    
    with pytest.raises(SecurityError, match="Unsafe path in ZIP archive detected"):
        ingest_zip_upload(upload_file)

def test_ingest_zip_slip_windows_traversal():
    upload_file = create_in_memory_upload_file("evil_win.zip", {
        "..\\escaped.txt": b"evil",
    })
    
    with pytest.raises(SecurityError, match="Unsafe path in ZIP archive detected"):
        ingest_zip_upload(upload_file)

def test_ingest_zip_absolute_path():
    upload_file = create_in_memory_upload_file("evil_abs.zip", {
        "/etc/passwd": b"root:x:0:0...",
    })
    
    with pytest.raises(SecurityError, match="Unsafe path in ZIP archive detected"):
        ingest_zip_upload(upload_file)

def test_ingest_zip_symlink():
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, "a", zipfile.ZIP_DEFLATED, False) as zf:
        zinfo = zipfile.ZipInfo("symlink.txt")
        zinfo.create_system = 3 # Unix
        zinfo.external_attr = 0o120755 << 16 # symlink mode
        zf.writestr(zinfo, "target.txt")

    zip_buffer.seek(0)
    upload_file = MagicMock(spec=UploadFile)
    upload_file.filename = "symlink.zip"
    upload_file.size = len(zip_buffer.getvalue())
    upload_file.file = zip_buffer

    with pytest.raises(SecurityError, match="Symlinks in ZIP archive are not allowed"):
        ingest_zip_upload(upload_file)

def test_ingest_zip_file_count_limit():
    content = {f"file_{i}.txt": b"a" for i in range(15)}
    upload_file = create_in_memory_upload_file("many.zip", content)

    with patch("app.ingestion.zip.settings.MAX_ZIP_ENTRIES", 10):
        with pytest.raises(ResourceLimitError, match="too many entries"):
            ingest_zip_upload(upload_file)

def test_ingest_zip_file_size_limit():
    content = {"huge.txt": b"x" * 2000}
    upload_file = create_in_memory_upload_file("huge.zip", content)

    with patch("app.ingestion.zip.settings.MAX_FILE_SIZE_MB", 0.001): # ~1000 bytes
        with pytest.raises(ResourceLimitError, match="exceeds single file size limit"):
            ingest_zip_upload(upload_file)
