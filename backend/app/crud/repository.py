from typing import List, Optional
from uuid import UUID

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.repository import Repository
from app.schemas.repository import RepositoryCreate, RepositoryUpdate


class CRUDRepository:
    def get(self, db: Session, id: UUID) -> Optional[Repository]:
        return db.query(Repository).filter(Repository.id == id).first()

    def get_by_source(self, db: Session, *, source_type: str, source_url: str) -> Optional[Repository]:
        return db.query(Repository).filter(
            Repository.source_type == source_type,
            Repository.source_url == source_url
        ).first()

    def get_multi(self, db: Session, *, skip: int = 0, limit: int = 100) -> List[Repository]:
        return db.query(Repository).offset(skip).limit(limit).all()

    def create(self, db: Session, *, obj_in: RepositoryCreate) -> Repository:
        db_obj = Repository(**obj_in.model_dump())
        db.add(db_obj)
        try:
            db.commit()
            db.refresh(db_obj)
            return db_obj
        except IntegrityError:
            db.rollback()
            raise ValueError("A repository with this source type and URL already exists.")

    def update(self, db: Session, *, db_obj: Repository, obj_in: RepositoryUpdate) -> Repository:
        update_data = obj_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def delete(self, db: Session, *, id: UUID) -> Optional[Repository]:
        obj = db.query(Repository).filter(Repository.id == id).first()
        if obj:
            db.delete(obj)
            db.commit()
        return obj


repository = CRUDRepository()
