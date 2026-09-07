from typing import List, Optional
from uuid import UUID

from sqlalchemy import or_
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.repository import Repository
from app.schemas.repository import RepositoryCreate, RepositoryUpdate


class CRUDRepository:
    def get(self, db: Session, id: UUID, user_id: Optional[UUID] = None) -> Optional[Repository]:
        query = db.query(Repository).filter(Repository.id == id)
        if user_id is not None:
            query = query.filter(or_(Repository.user_id == user_id, Repository.user_id.is_(None)))
        return query.first()

    def get_by_source(
        self,
        db: Session,
        *,
        source_type: str,
        source_url: str,
        user_id: Optional[UUID] = None,
    ) -> Optional[Repository]:
        query = db.query(Repository).filter(
            Repository.source_type == source_type,
            Repository.source_url == source_url,
        )
        if user_id is not None:
            query = query.filter(Repository.user_id == user_id)
        else:
            query = query.filter(Repository.user_id.is_(None))
        return query.first()

    def get_multi(
        self,
        db: Session,
        *,
        user_id: Optional[UUID] = None,
        skip: int = 0,
        limit: int = 100,
    ) -> List[Repository]:
        query = db.query(Repository)
        if user_id is not None:
            query = query.filter(or_(Repository.user_id == user_id, Repository.user_id.is_(None)))
        else:
            query = query.filter(Repository.user_id.is_(None))
        return query.order_by(Repository.created_at.desc()).offset(skip).limit(limit).all()

    def create(
        self,
        db: Session,
        *,
        obj_in: RepositoryCreate,
        user_id: Optional[UUID] = None,
    ) -> Repository:
        # Check duplicate for the same user (or anonymous)
        existing = self.get_by_source(
            db,
            source_type=obj_in.source_type,
            source_url=obj_in.source_url,
            user_id=user_id,
        )
        if existing:
            raise ValueError("A repository with this source type and URL already exists.")

        data = obj_in.model_dump()
        if user_id is not None:
            data["user_id"] = user_id
        db_obj = Repository(**data)
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

    def delete(self, db: Session, *, id: UUID, user_id: Optional[UUID] = None) -> Optional[Repository]:
        query = db.query(Repository).filter(Repository.id == id)
        if user_id is not None:
            query = query.filter(Repository.user_id == user_id)
        obj = query.first()
        if obj:
            db.delete(obj)
            db.commit()
        return obj


repository = CRUDRepository()
