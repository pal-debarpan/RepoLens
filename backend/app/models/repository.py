import enum
import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, DateTime, Enum, Index
from sqlalchemy.dialects.postgresql import UUID

from app.db.base import Base


class SourceType(str, enum.Enum):
    github = "github"
    zip = "zip"


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class Repository(Base):
    __tablename__ = "repositories"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    source_type = Column(Enum(SourceType, name="sourcetype", create_constraint=True), nullable=False)
    source_url = Column(String, nullable=False)
    
    name = Column(String, nullable=True)
    default_branch = Column(String, nullable=True)
    primary_language = Column(String, nullable=True)
    description = Column(String, nullable=True)
    latest_commit_sha = Column(String, nullable=True)
    
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    __table_args__ = (
        Index("uix_source_type_url", "source_type", "source_url", unique=True),
    )
