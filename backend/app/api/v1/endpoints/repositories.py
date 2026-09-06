from typing import Any, List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session

from app import crud, schemas
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
) -> Any:
    """
    Ingest a public GitHub repository.
    """
    target_url = request.url or request.source_url
    if not target_url:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Either 'url' or 'source_url' must be provided.")
    try:
        ingested = ingest_github_repo(target_url)
    except SecurityError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except ResourceLimitError as e:
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail=str(e))
    except IngestionError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    repo_dict = _ingested_to_dict(ingested)
    repository = crud.repository.get_by_source(db, source_type=ingested.source_type, source_url=ingested.source_url)
    
    if repository:
        update_dict = {k: v for k, v in repo_dict.items() if k not in ("source_type", "source_url")}
        repo_update = schemas.RepositoryUpdate(**update_dict)
        repository = crud.repository.update(db=db, db_obj=repository, obj_in=repo_update)
    else:
        repo_create = schemas.RepositoryCreate(**repo_dict)
        repository = crud.repository.create(db=db, obj_in=repo_create)
        
    return repository

@router.post("/upload", response_model=schemas.RepositoryResponse, status_code=status.HTTP_201_CREATED)
def ingest_upload(
    *,
    db: Session = Depends(get_db),
    file: UploadFile = File(...),
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

    repo_dict = _ingested_to_dict(ingested)
    repository = crud.repository.get_by_source(db, source_type=ingested.source_type, source_url=ingested.source_url)
    
    if repository:
        update_dict = {k: v for k, v in repo_dict.items() if k not in ("source_type", "source_url")}
        repo_update = schemas.RepositoryUpdate(**update_dict)
        repository = crud.repository.update(db=db, db_obj=repository, obj_in=repo_update)
    else:
        repo_create = schemas.RepositoryCreate(**repo_dict)
        repository = crud.repository.create(db=db, obj_in=repo_create)
        
    return repository

@router.post("/", response_model=schemas.RepositoryResponse, status_code=status.HTTP_201_CREATED)
def create_repository(
    *,
    db: Session = Depends(get_db),
    repository_in: schemas.RepositoryCreate,
) -> Any:
    """
    Create a new repository record.
    """
    try:
        repository = crud.repository.create(db=db, obj_in=repository_in)
        return repository
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))

@router.get("/", response_model=List[schemas.RepositoryResponse])
def read_repositories(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve repositories.
    """
    repositories = crud.repository.get_multi(db, skip=skip, limit=limit)
    return repositories

@router.get("/{repository_id}", response_model=schemas.RepositoryResponse)
def read_repository(
    *,
    db: Session = Depends(get_db),
    repository_id: UUID,
) -> Any:
    """
    Get a repository by ID.
    """
    repository = crud.repository.get(db=db, id=repository_id)
    if not repository:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Repository not found")
    return repository

@router.patch("/{repository_id}", response_model=schemas.RepositoryResponse)
def update_repository(
    *,
    db: Session = Depends(get_db),
    repository_id: UUID,
    repository_in: schemas.RepositoryUpdate,
) -> Any:
    """
    Update a repository.
    """
    repository = crud.repository.get(db=db, id=repository_id)
    if not repository:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Repository not found")
    repository = crud.repository.update(db=db, db_obj=repository, obj_in=repository_in)
    return repository

@router.delete("/{repository_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_repository(
    *,
    db: Session = Depends(get_db),
    repository_id: UUID,
) -> None:
    """
    Delete a repository.
    """
    repository = crud.repository.get(db=db, id=repository_id)
    if not repository:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Repository not found")
    crud.repository.delete(db=db, id=repository_id)
    return None
