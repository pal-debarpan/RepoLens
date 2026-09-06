from fastapi.testclient import TestClient
from app.core.config import settings


def test_openapi_metadata(client: TestClient) -> None:
    """Verify OpenAPI documentation metadata matches application configuration."""
    response = client.get("/openapi.json")

    assert response.status_code == 200
    assert "application/json" in response.headers.get("content-type", "")

    schema = response.json()
    assert "info" in schema
    assert schema["info"]["title"] == settings.APP_NAME
    assert schema["info"]["version"] == settings.APP_VERSION
    assert "description" in schema["info"]
    assert len(schema["info"]["description"]) > 0


def test_swagger_and_redoc_endpoints(client: TestClient) -> None:
    """Verify interactive documentation endpoints are available."""
    docs_response = client.get("/docs")
    assert docs_response.status_code == 200

    redoc_response = client.get("/redoc")
    assert redoc_response.status_code == 200


def test_cors_preflight_allowed_origin(client: TestClient) -> None:
    """Verify CORS preflight request allows configured development origins."""
    headers = {
        "Origin": "http://localhost:3000",
        "Access-Control-Request-Method": "GET",
    }
    response = client.options("/health", headers=headers)

    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "http://localhost:3000"
    assert response.headers.get("access-control-allow-credentials") == "true"


def test_cors_simple_request_allowed_origin(client: TestClient) -> None:
    """Verify CORS headers on standard requests from allowed origins."""
    headers = {"Origin": "http://localhost:5173"}
    response = client.get("/", headers=headers)

    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "http://localhost:5173"


def test_cors_disallowed_origin(client: TestClient) -> None:
    """Verify CORS headers are not returned for unapproved origins."""
    headers = {
        "Origin": "http://unauthorized-domain.com",
        "Access-Control-Request-Method": "GET",
    }
    response = client.options("/health", headers=headers)

    assert response.headers.get("access-control-allow-origin") is None


def test_api_v1_route_handling(client: TestClient) -> None:
    """Verify versioned API router prefix is mounted and handles unknown sub-routes."""
    response = client.get(f"{settings.API_V1_PREFIX}/nonexistent")

    assert response.status_code == 404
    assert "application/json" in response.headers.get("content-type", "")
