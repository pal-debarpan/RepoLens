import uuid
import jwt
import pytest
from fastapi.testclient import TestClient

from app.core.config import settings
from app.models.repository import Repository, SourceType
from app.models.analysis import Analysis, AnalysisStatus
from app.services.demo_fixture import DEMO_ANALYSIS_ID


USER_A_ID = uuid.uuid4()
USER_B_ID = uuid.uuid4()


def create_jwt_token(user_id: uuid.UUID, email: str) -> str:
    payload = {
        "sub": str(user_id),
        "email": email,
        "aud": "authenticated",
        "role": "authenticated",
    }
    secret = settings.SUPABASE_JWT_SECRET or "test-secret-that-is-at-least-32-bytes-long"
    return jwt.encode(payload, secret, algorithm="HS256")


def test_user_a_and_user_b_repository_isolation(client: TestClient, db_session):
    token_a = create_jwt_token(USER_A_ID, "user_a@test.com")
    token_b = create_jwt_token(USER_B_ID, "user_b@test.com")

    headers_a = {"Authorization": f"Bearer {token_a}"}
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # 1. User A creates a repository
    res_a = client.post(
        "/api/v1/repositories/",
        headers=headers_a,
        json={
            "source_type": "github",
            "source_url": "https://github.com/user-a/private-project",
            "name": "project-a",
            "workspace_path": "/tmp/workspaces/project-a",
        },
    )
    assert res_a.status_code == 201
    repo_a = res_a.json()
    repo_a_id = repo_a["id"]

    # 2. User B creates a repository
    res_b = client.post(
        "/api/v1/repositories/",
        headers=headers_b,
        json={
            "source_type": "github",
            "source_url": "https://github.com/user-b/secret-system",
            "name": "project-b",
            "workspace_path": "/tmp/workspaces/project-b",
        },
    )
    assert res_b.status_code == 201
    repo_b = res_b.json()
    repo_b_id = repo_b["id"]

    # 3. User A lists repositories -> Must only see Project A
    list_a = client.get("/api/v1/repositories/", headers=headers_a)
    assert list_a.status_code == 200
    repos_for_a = list_a.json()
    repo_ids_for_a = [r["id"] for r in repos_for_a]
    assert repo_a_id in repo_ids_for_a
    assert repo_b_id not in repo_ids_for_a

    # 4. User B lists repositories -> Must only see Project B
    list_b = client.get("/api/v1/repositories/", headers=headers_b)
    assert list_b.status_code == 200
    repos_for_b = list_b.json()
    repo_ids_for_b = [r["id"] for r in repos_for_b]
    assert repo_b_id in repo_ids_for_b
    assert repo_a_id not in repo_ids_for_b

    # 5. User A tries to GET User B's repository by ID -> Must receive 404 Not Found
    detail_res = client.get(f"/api/v1/repositories/{repo_b_id}", headers=headers_a)
    assert detail_res.status_code == 404

    # 6. User A tries to PATCH User B's repository -> Must receive 404 Not Found
    patch_res = client.patch(
        f"/api/v1/repositories/{repo_b_id}",
        headers=headers_a,
        json={"name": "hacked-name"},
    )
    assert patch_res.status_code == 404

    # 7. User A tries to DELETE User B's repository -> Must receive 404 Not Found
    delete_res = client.delete(f"/api/v1/repositories/{repo_b_id}", headers=headers_a)
    assert delete_res.status_code == 404

    # Verify repo B is still intact
    get_b = client.get(f"/api/v1/repositories/{repo_b_id}", headers=headers_b)
    assert get_b.status_code == 200


def test_user_a_and_user_b_analysis_isolation(client: TestClient, db_session):
    token_a = create_jwt_token(USER_A_ID, "user_a@test.com")
    token_b = create_jwt_token(USER_B_ID, "user_b@test.com")

    headers_a = {"Authorization": f"Bearer {token_a}"}
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # Setup repositories directly in DB
    repo_a = Repository(
        user_id=USER_A_ID,
        source_type=SourceType.github,
        source_url="https://github.com/user-a/repo",
        name="repo-a",
        workspace_path="/tmp/test/repo-a",
    )
    repo_b = Repository(
        user_id=USER_B_ID,
        source_type=SourceType.github,
        source_url="https://github.com/user-b/repo",
        name="repo-b",
        workspace_path="/tmp/test/repo-b",
    )
    db_session.add_all([repo_a, repo_b])
    db_session.commit()
    db_session.refresh(repo_a)
    db_session.refresh(repo_b)

    # User B has an analysis
    analysis_b = Analysis(
        repository_id=repo_b.id,
        user_id=USER_B_ID,
        status=AnalysisStatus.COMPLETED,
        file_count=10,
        total_lines=500,
        quality_score=85.0,
        graph_data={"nodes": [], "edges": []},
        quality_details={"overall_score": 85.0, "grade": "B", "categories": {}},
        testing_details={"recommendations": []},
    )
    db_session.add(analysis_b)
    db_session.commit()
    db_session.refresh(analysis_b)

    # User A tries to GET User B's analysis detail -> 404 Not Found
    res = client.get(f"/api/v1/analyses/{analysis_b.id}", headers=headers_a)
    assert res.status_code == 404

    # User A tries to GET User B's graph -> 404 Not Found
    res_graph = client.get(f"/api/v1/analyses/{analysis_b.id}/graph", headers=headers_a)
    assert res_graph.status_code == 404

    # User A tries to GET User B's blast-radius -> 404 Not Found
    res_blast = client.get(f"/api/v1/analyses/{analysis_b.id}/blast-radius?file_path=main.py", headers=headers_a)
    assert res_blast.status_code == 404

    # User A tries to GET User B's findings -> 404 Not Found
    res_findings = client.get(f"/api/v1/analyses/{analysis_b.id}/findings", headers=headers_a)
    assert res_findings.status_code == 404

    # User A tries to GET User B's quality assessment -> 404 Not Found
    res_quality = client.get(f"/api/v1/analyses/{analysis_b.id}/quality", headers=headers_a)
    assert res_quality.status_code == 404

    # User A tries to GET User B's testing recommendations -> 404 Not Found
    res_testing = client.get(f"/api/v1/analyses/{analysis_b.id}/testing", headers=headers_a)
    assert res_testing.status_code == 404

    # User A tries to chat with AI on User B's analysis -> 404 Not Found
    res_chat = client.post(
        f"/api/v1/analyses/{analysis_b.id}/chat",
        headers=headers_a,
        json={"message": "Summarize this repo for me"},
    )
    assert res_chat.status_code == 404

    # User B can view their own analysis successfully
    res_b_ok = client.get(f"/api/v1/analyses/{analysis_b.id}", headers=headers_b)
    assert res_b_ok.status_code == 200
    assert res_b_ok.json()["id"] == str(analysis_b.id)


def test_public_demo_analysis_accessible_to_all(client: TestClient):
    # Demo analysis should be accessible without auth or with any user token
    res_anon = client.get(f"/api/v1/analyses/{DEMO_ANALYSIS_ID}")
    assert res_anon.status_code == 200
    assert res_anon.json()["id"] == str(DEMO_ANALYSIS_ID)

    token_a = create_jwt_token(USER_A_ID, "user_a@test.com")
    res_auth = client.get(
        f"/api/v1/analyses/{DEMO_ANALYSIS_ID}",
        headers={"Authorization": f"Bearer {token_a}"},
    )
    assert res_auth.status_code == 200
    assert res_auth.json()["id"] == str(DEMO_ANALYSIS_ID)
