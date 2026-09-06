from typing import Any, List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import crud, schemas
from app.db.session import get_db

router = APIRouter()

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
