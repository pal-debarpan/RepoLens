import pytest
from uuid import uuid4

def test_create_repository_api(client):
    data = {
        "source_type": "github",
        "source_url": "https://github.com/myorg/repo",
        "name": "myorg/repo",
        "default_branch": "main"
    }
    response = client.post("/api/v1/repositories/", json=data)
    assert response.status_code == 201
    content = response.json()
    assert content["source_type"] == "github"
    assert content["source_url"] == "https://github.com/myorg/repo"
    assert "id" in content

def test_create_repository_invalid_github_url(client):
    data = {
        "source_type": "github",
        "source_url": "http://not-github.com"
    }
    response = client.post("/api/v1/repositories/", json=data)
    assert response.status_code == 422
    assert "GitHub source_url must start with https://github.com/" in response.text

def test_create_repository_duplicate(client, db_session):
    data = {
        "source_type": "github",
        "source_url": "https://github.com/myorg/dup"
    }
    client.post("/api/v1/repositories/", json=data)
    response = client.post("/api/v1/repositories/", json=data)
    assert response.status_code == 409

def test_get_repositories(client, db_session):
    data = {
        "source_type": "github",
        "source_url": "https://github.com/myorg/list"
    }
    client.post("/api/v1/repositories/", json=data)
    response = client.get("/api/v1/repositories/")
    assert response.status_code == 200
    content = response.json()
    assert isinstance(content, list)
    assert len(content) >= 1

def test_get_repository_by_id(client):
    data = {
        "source_type": "zip",
        "source_url": "https://example.com/repo.zip"
    }
    create_resp = client.post("/api/v1/repositories/", json=data)
    repo_id = create_resp.json()["id"]

    response = client.get(f"/api/v1/repositories/{repo_id}")
    assert response.status_code == 200
    assert response.json()["id"] == repo_id

def test_get_repository_not_found(client):
    response = client.get(f"/api/v1/repositories/{uuid4()}")
    assert response.status_code == 404

def test_update_repository(client):
    data = {
        "source_type": "github",
        "source_url": "https://github.com/myorg/update"
    }
    create_resp = client.post("/api/v1/repositories/", json=data)
    repo_id = create_resp.json()["id"]

    update_data = {"description": "new desc", "latest_commit_sha": "abc1234"}
    response = client.patch(f"/api/v1/repositories/{repo_id}", json=update_data)
    assert response.status_code == 200
    assert response.json()["description"] == "new desc"
    assert response.json()["latest_commit_sha"] == "abc1234"

def test_delete_repository(client):
    data = {
        "source_type": "github",
        "source_url": "https://github.com/myorg/delete"
    }
    create_resp = client.post("/api/v1/repositories/", json=data)
    repo_id = create_resp.json()["id"]

    delete_resp = client.delete(f"/api/v1/repositories/{repo_id}")
    assert delete_resp.status_code == 204

    get_resp = client.get(f"/api/v1/repositories/{repo_id}")
    assert get_resp.status_code == 404
