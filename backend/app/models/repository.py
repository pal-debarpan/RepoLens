import enum
import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, DateTime, Enum, ForeignKey, Index, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.base import Base


class SourceType(str, enum.Enum):
    github = "github"
    zip = "zip"


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class Repository(Base):
    __tablename__ = "repositories"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    # user_id added to Supabase in migration 004
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("profiles.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    source_type = Column(Enum(SourceType, name="sourcetype", create_constraint=True), nullable=False)
    source_url = Column(String, nullable=True)  # nullable in Supabase

    name = Column(String, nullable=True)        # NOT NULL in Supabase but we keep nullable for safety
    full_name = Column(String, nullable=True)   # Supabase-specific extra column
    default_branch = Column(String, nullable=True)
    primary_language = Column(String, nullable=True)
    description = Column(String, nullable=True)
    latest_commit_sha = Column(String, nullable=True)

    # Added in migration 004
    workspace_path = Column(String, nullable=True)
    file_count = Column(Integer, nullable=True)
    total_size_bytes = Column(Integer, nullable=True)

    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    # Relationships
    user = relationship("User", backref="repositories", lazy="joined")
    analyses = relationship("Analysis", back_populates="repository", cascade="all, delete-orphan")

    __table_args__ = (
        Index("uix_user_source_type_url", "user_id", "source_type", "source_url"),
    )
