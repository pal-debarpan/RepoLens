import sys
from pathlib import Path
from typing import Generator
import pytest
from fastapi.testclient import TestClient

# Ensure backend root is in sys.path for test discovery
backend_dir = Path(__file__).resolve().parent.parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.main import app


@pytest.fixture(scope="session")
def client() -> Generator[TestClient, None, None]:
    """Test client fixture for API endpoint verification."""
    with TestClient(app) as test_client:
        yield test_client
