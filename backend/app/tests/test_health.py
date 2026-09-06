from fastapi.testclient import TestClient


def test_root_endpoint(client: TestClient) -> None:
    """Test GET / returns 200, valid JSON, and expected Repolens metadata fields."""
    response = client.get("/")

    assert response.status_code == 200
    assert "application/json" in response.headers.get("content-type", "")

    data = response.json()
    assert isinstance(data, dict)
    assert data["message"] == "Repolens API is running"
    assert "app_name" in data
    assert "version" in data
    assert data["docs_url"] == "/docs"


def test_health_endpoint(client: TestClient) -> None:
    """Test GET /health returns 200, valid JSON, and healthy service status."""
    response = client.get("/health")

    assert response.status_code == 200
    assert "application/json" in response.headers.get("content-type", "")

    data = response.json()
    assert isinstance(data, dict)
    assert data["status"] == "healthy"
    assert data["service"] == "repolens-backend"
    assert "environment" in data
    assert "version" in data


def test_not_found_endpoint(client: TestClient) -> None:
    """Test that nonexistent routes naturally return a 404 error."""
    response = client.get("/non-existent-route-for-testing")

    assert response.status_code == 404
    assert "application/json" in response.headers.get("content-type", "")
