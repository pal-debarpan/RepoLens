import uuid
from typing import Any, List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session

from app import crud, schemas
from app.core.auth import AuthenticatedUser, get_current_user_optional
from app.db.session import get_db
from app.ingestion.github import ingest_github_repo
from app.ingestion.zip import ingest_zip_upload
from app.ingestion.exceptions import IngestionError, SecurityError, ResourceLimitError

router = APIRouter()


def _ingested_to_dict(ingested) -> dict:
    data = ingested.model_dump()
    if "repository_name" in data and "name" not in data:
        data["name"] = data.pop("repository_name")
    valid_keys = {
        "source_type", "source_url", "name", "default_branch",
        "primary_language", "description", "latest_commit_sha",
        "workspace_path", "file_count", "total_size_bytes"
    }
    return {k: v for k, v in data.items() if k in valid_keys}


@router.post("/github", response_model=schemas.RepositoryResponse, status_code=status.HTTP_201_CREATED)
def ingest_github(
    *,
    db: Session = Depends(get_db),
    request: schemas.GitHubIngestRequest,
    current_user: Optional[AuthenticatedUser] = Depends(get_current_user_optional),
) -> Any:
    """
    Ingest a GitHub repository.

    Public repositories work without authentication.
    Private repositories require a `pat` (GitHub Personal Access Token) in the request body.
    The PAT is never stored — it is used only to verify access and perform the clone.
    Codebases are isolated and owned by the authenticated user.
    """
    target_url = request.url or request.source_url
    if not target_url:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Either 'url' or 'source_url' must be provided.")
    try:
        # pat is passed through but never stored in the DB
        ingested = ingest_github_repo(target_url, pat=request.pat)
    except SecurityError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except ResourceLimitError as e:
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail=str(e))
    except IngestionError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    user_id = uuid.UUID(str(current_user.id)) if current_user else None
    repo_dict = _ingested_to_dict(ingested)
    repository = crud.repository.get_by_source(
        db,
        source_type=ingested.source_type,
        source_url=ingested.source_url,
        user_id=user_id,
    )
    
    if repository:
        update_dict = {k: v for k, v in repo_dict.items() if k not in ("source_type", "source_url")}
        repo_update = schemas.RepositoryUpdate(**update_dict)
        repository = crud.repository.update(db=db, db_obj=repository, obj_in=repo_update)
    else:
        repo_create = schemas.RepositoryCreate(**repo_dict)
        repository = crud.repository.create(db=db, obj_in=repo_create, user_id=user_id)
        
    return repository


@router.post("/upload", response_model=schemas.RepositoryResponse, status_code=status.HTTP_201_CREATED)
def ingest_upload(
    *,
    db: Session = Depends(get_db),
    file: UploadFile = File(...),
    current_user: Optional[AuthenticatedUser] = Depends(get_current_user_optional),
) -> Any:
    """
    Ingest a repository from a ZIP file upload.
    """
    try:
        ingested = ingest_zip_upload(file)
    except SecurityError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except ResourceLimitError as e:
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail=str(e))
    except IngestionError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    user_id = uuid.UUID(str(current_user.id)) if current_user else None
    repo_dict = _ingested_to_dict(ingested)
    repository = crud.repository.get_by_source(
        db,
        source_type=ingested.source_type,
        source_url=ingested.source_url,
        user_id=user_id,
    )
    
    if repository:
        update_dict = {k: v for k, v in repo_dict.items() if k not in ("source_type", "source_url")}
        repo_update = schemas.RepositoryUpdate(**update_dict)
        repository = crud.repository.update(db=db, db_obj=repository, obj_in=repo_update)
    else:
        repo_create = schemas.RepositoryCreate(**repo_dict)
        repository = crud.repository.create(db=db, obj_in=repo_create, user_id=user_id)
        
    return repository


@router.post("/", response_model=schemas.RepositoryResponse, status_code=status.HTTP_201_CREATED)
def create_repository(
    *,
    db: Session = Depends(get_db),
    repository_in: schemas.RepositoryCreate,
    current_user: Optional[AuthenticatedUser] = Depends(get_current_user_optional),
) -> Any:
    """
    Create a new repository record.
    """
    user_id = uuid.UUID(str(current_user.id)) if current_user else None
    try:
        repository = crud.repository.create(db=db, obj_in=repository_in, user_id=user_id)
        return repository
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))


@router.get("/", response_model=List[schemas.RepositoryResponse])
def read_repositories(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: Optional[AuthenticatedUser] = Depends(get_current_user_optional),
) -> Any:
    """
    Retrieve repositories owned by the current user (plus demo repositories).
    """
    user_id = uuid.UUID(str(current_user.id)) if current_user else None
    repositories = crud.repository.get_multi(db, user_id=user_id, skip=skip, limit=limit)
    return repositories


@router.get("/{repository_id}", response_model=schemas.RepositoryResponse)
def read_repository(
    *,
    db: Session = Depends(get_db),
    repository_id: UUID,
    current_user: Optional[AuthenticatedUser] = Depends(get_current_user_optional),
) -> Any:
    """
    Get a repository by ID. Enforces user isolation.
    """
    user_id = uuid.UUID(str(current_user.id)) if current_user else None
    repository = crud.repository.get(db=db, id=repository_id, user_id=user_id)
    if not repository:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Repository not found")
    return repository


@router.patch("/{repository_id}", response_model=schemas.RepositoryResponse)
def update_repository(
    *,
    db: Session = Depends(get_db),
    repository_id: UUID,
    repository_in: schemas.RepositoryUpdate,
    current_user: Optional[AuthenticatedUser] = Depends(get_current_user_optional),
) -> Any:
    """
    Update a repository. Only the owner can update.
    """
    user_id = uuid.UUID(str(current_user.id)) if current_user else None
    repository = crud.repository.get(db=db, id=repository_id, user_id=user_id)
    if not repository:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Repository not found")
    if repository.user_id is not None and (not user_id or repository.user_id != user_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Repository not found")
    repository = crud.repository.update(db=db, db_obj=repository, obj_in=repository_in)
    return repository


@router.delete("/{repository_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_repository(
    *,
    db: Session = Depends(get_db),
    repository_id: UUID,
    current_user: Optional[AuthenticatedUser] = Depends(get_current_user_optional),
) -> None:
    """
    Delete a repository. Only the owner can delete.
    """
    user_id = uuid.UUID(str(current_user.id)) if current_user else None
    repository = crud.repository.get(db=db, id=repository_id, user_id=user_id)
    if not repository:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Repository not found")
    if repository.user_id is not None and (not user_id or repository.user_id != user_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Repository not found")
    crud.repository.delete(db=db, id=repository_id, user_id=user_id)
    return None
