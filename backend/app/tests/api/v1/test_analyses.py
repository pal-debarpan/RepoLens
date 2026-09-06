import pytest
from uuid import uuid4
from app.services.demo_fixture import DEMO_ANALYSIS_ID


def test_get_demo_analysis_detail(client):
    response = client.get(f"/api/v1/analyses/{DEMO_ANALYSIS_ID}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == str(DEMO_ANALYSIS_ID)
    assert data["status"] == "COMPLETED"
    assert data["quality_score"] == 72.4
    assert len(data["findings"]) == 4
    assert len(data["quality"]["characteristics"]) == 9
    assert len(data["testing"]["recommendations"]) == 4
    assert len(data["graph"]["nodes"]) == 15


def test_get_demo_blast_radius(client):
    response = client.get(
        f"/api/v1/analyses/{DEMO_ANALYSIS_ID}/blast-radius?file_path=src/services/paymentService.js"
    )
    assert response.status_code == 200
    data = response.json()
    assert data["target_file"] == "src/services/paymentService.js"
    assert data["score"] == 72.0
    assert data["impact_level"] == "HIGH"
    assert data["total_affected_count"] == 11
    assert "tests/payment.test.js" in data["test_targets"]


def test_get_demo_graph(client):
    response = client.get(f"/api/v1/analyses/{DEMO_ANALYSIS_ID}/graph")
    assert response.status_code == 200
    data = response.json()
    assert len(data["nodes"]) == 15
    assert len(data["edges"]) == 16


def test_get_demo_file_graph(client):
    response = client.get(
        f"/api/v1/analyses/{DEMO_ANALYSIS_ID}/graph/src/services/paymentService.js"
    )
    assert response.status_code == 200
    data = response.json()
    assert data["target_file"] == "src/services/paymentService.js"
    assert "src/services/paymentService.js" in [n["id"] for n in data["nodes"]]


def test_get_demo_findings(client):
    response = client.get(f"/api/v1/analyses/{DEMO_ANALYSIS_ID}/findings")
    assert response.status_code == 200
    findings = response.json()
    assert len(findings) == 4

    # Test filtering by category
    sec_resp = client.get(
        f"/api/v1/analyses/{DEMO_ANALYSIS_ID}/findings?category=SECURITY"
    )
    assert sec_resp.status_code == 200
    assert len(sec_resp.json()) == 1
    assert sec_resp.json()[0]["category"] == "SECURITY"

    # Test filtering by severity
    crit_resp = client.get(
        f"/api/v1/analyses/{DEMO_ANALYSIS_ID}/findings?severity=CRITICAL"
    )
    assert crit_resp.status_code == 200
    assert len(crit_resp.json()) == 1
    assert crit_resp.json()[0]["severity"] == "CRITICAL"


def test_get_demo_quality(client):
    response = client.get(f"/api/v1/analyses/{DEMO_ANALYSIS_ID}/quality")
    assert response.status_code == 200
    data = response.json()
    assert data["overall_score"] == 72.4
    assert len(data["characteristics"]) == 9


def test_get_demo_testing(client):
    response = client.get(f"/api/v1/analyses/{DEMO_ANALYSIS_ID}/testing")
    assert response.status_code == 200
    data = response.json()
    assert data["total_recommendations"] == 4
    assert data["existing_test_files_count"] == 2
    assert len(data["recommendations"]) == 4


def test_demo_chat(client):
    payload = {"message": "Explain the paymentService.js blast radius"}
    response = client.post(f"/api/v1/analyses/{DEMO_ANALYSIS_ID}/chat", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "repolens-demo" in data["answer"].lower()
    assert data["model_used"] == "demo"


def test_get_analysis_not_found(client):
    random_id = uuid4()
    response = client.get(f"/api/v1/analyses/{random_id}")
    assert response.status_code == 404


def test_get_user_analyses_unauthorized(client):
    response = client.get("/api/v1/analyses")
    assert response.status_code == 401
