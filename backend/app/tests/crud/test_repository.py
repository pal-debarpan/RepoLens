import pytest
from app.crud.repository import repository
from app.schemas.repository import RepositoryCreate, RepositoryUpdate
from app.models.repository import SourceType

def test_create_repository_crud(db_session):
    repo_in = RepositoryCreate(
        source_type=SourceType.zip,
        source_url="https://example.com/test.zip",
        name="test"
    )
    repo = repository.create(db_session, obj_in=repo_in)
    assert repo.source_type == SourceType.zip
    assert repo.source_url == "https://example.com/test.zip"
    assert repo.name == "test"
    assert repo.created_at is not None
    assert repo.updated_at is not None

def test_duplicate_repository_crud(db_session):
    repo_in = RepositoryCreate(
        source_type=SourceType.github,
        source_url="https://github.com/dup/crud_dup"
    )
    repository.create(db_session, obj_in=repo_in)
    with pytest.raises(ValueError):
        repository.create(db_session, obj_in=repo_in)
