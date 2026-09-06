import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from uuid import uuid4

from app.ingestion.models import IngestedRepository
from app.models.repository import SourceType
from app.ingestion.exceptions import SecurityError

def test_ingest_github_endpoint_success(client: TestClient):
    with patch('app.api.v1.endpoints.repositories.ingest_github_repo') as mock_ingest:
        mock_ingest.return_value = IngestedRepository(
            source_type=SourceType.github,
            source_url="https://github.com/org/repo",
            repository_name="org/repo",
            workspace_path="/tmp/workspace/123",
            file_count=10,
            total_size_bytes=1024,
            default_branch="main"
        )
        
        response = client.post(
            "/api/v1/repositories/github",
            json={"source_url": "https://github.com/org/repo"}
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["source_url"] == "https://github.com/org/repo"
        assert data["workspace_path"] == "/tmp/workspace/123"
        assert data["file_count"] == 10

def test_ingest_github_endpoint_invalid_url(client: TestClient):
    response = client.post(
        "/api/v1/repositories/github",
        json={"source_url": "http://evil.com/org/repo"}
    )
    # The Pydantic validator will catch this and return 422
    assert response.status_code == 422

def test_ingest_github_endpoint_success_with_url_field(client: TestClient):
    with patch('app.api.v1.endpoints.repositories.ingest_github_repo') as mock_ingest:
        mock_ingest.return_value = IngestedRepository(
            source_type=SourceType.github,
            source_url="https://github.com/org/repo",
            repository_name="org/repo",
            workspace_path="/tmp/workspace/123",
            file_count=10,
            total_size_bytes=1024,
            default_branch="main"
        )
        
        response = client.post(
            "/api/v1/repositories/github",
            json={"url": "https://github.com/org/repo"}
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["source_url"] == "https://github.com/org/repo"
        assert data["workspace_path"] == "/tmp/workspace/123"
        assert data["file_count"] == 10

def test_ingest_upload_endpoint_success(client: TestClient):
    with patch('app.api.v1.endpoints.repositories.ingest_zip_upload') as mock_ingest:
        mock_ingest.return_value = IngestedRepository(
            source_type=SourceType.zip,
            source_url="zip://test.zip",
            repository_name="test.zip",
            workspace_path="/tmp/workspace/456",
            file_count=5,
            total_size_bytes=500,
            default_branch="main"
        )
        
        response = client.post(
            "/api/v1/repositories/upload",
            files={"file": ("test.zip", b"dummy content", "application/zip")}
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["source_url"] == "zip://test.zip"
        assert data["workspace_path"] == "/tmp/workspace/456"
        assert data["file_count"] == 5

def test_ingest_upload_endpoint_security_error(client: TestClient):
    with patch('app.api.v1.endpoints.repositories.ingest_zip_upload') as mock_ingest:
        mock_ingest.side_effect = SecurityError("Unsafe path detected")
        
        response = client.post(
            "/api/v1/repositories/upload",
            files={"file": ("evil.zip", b"dummy content", "application/zip")}
        )
        
        assert response.status_code == 400
        assert "Unsafe path detected" in response.json()["detail"]
