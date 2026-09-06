import pytest
from unittest.mock import patch, MagicMock
import subprocess
from pathlib import Path

from app.ingestion.github import ingest_github_repo, GITHUB_URL_REGEX
from app.ingestion.exceptions import SecurityError, IngestionError, ResourceLimitError

def test_github_regex():
    assert GITHUB_URL_REGEX.match("https://github.com/org/repo")
    assert GITHUB_URL_REGEX.match("https://github.com/org/repo.git")
    assert not GITHUB_URL_REGEX.match("http://github.com/org/repo")
    assert not GITHUB_URL_REGEX.match("https://github.com/org")
    assert not GITHUB_URL_REGEX.match("https://gitlab.com/org/repo")

def test_ingest_github_invalid_url():
    with pytest.raises(SecurityError):
        ingest_github_repo("https://evil.com/org/repo")

@patch('app.ingestion.github.subprocess.run')
@patch('app.ingestion.github._calculate_repo_stats')
@patch('app.ingestion.github._get_default_branch')
def test_ingest_github_success(mock_branch, mock_stats, mock_run):
    mock_run.return_value = MagicMock(returncode=0)
    mock_stats.return_value = (10, 1024)
    mock_branch.return_value = "main"

    repo = ingest_github_repo("https://github.com/testorg/testrepo")
    
    assert repo.source_url == "https://github.com/testorg/testrepo"
    assert repo.repository_name == "testorg/testrepo"
    assert repo.file_count == 10
    assert repo.total_size_bytes == 1024
    assert mock_run.called

@patch('app.ingestion.github.subprocess.run')
def test_ingest_github_clone_failure(mock_run):
    mock_run.return_value = MagicMock(returncode=128, stderr="Repository not found")

    with pytest.raises(IngestionError, match="Repository not found or is private"):
        ingest_github_repo("https://github.com/testorg/testrepo")

@patch('app.ingestion.github.subprocess.run')
def test_ingest_github_generic_failure(mock_run):
    mock_run.return_value = MagicMock(returncode=1, stderr="fatal: some other git error")

    with pytest.raises(IngestionError, match="Git clone failed for repository"):
        ingest_github_repo("https://github.com/testorg/testrepo")

@patch('app.ingestion.github.subprocess.run')
def test_ingest_github_timeout(mock_run):
    mock_run.side_effect = subprocess.TimeoutExpired(cmd="git", timeout=60)

    with pytest.raises(ResourceLimitError, match="Git clone timed out"):
        ingest_github_repo("https://github.com/testorg/testrepo")
