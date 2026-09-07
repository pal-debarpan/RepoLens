"""SQLAlchemy model for analysis_dependencies table."""
import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, Float, String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.base import Base


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class AnalysisDependency(Base):
    """
    A resolved file-to-file dependency within an analysis run.
    Maps to the `analysis_dependencies` table in Supabase.
    """
    __tablename__ = "analysis_dependencies"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    analysis_id = Column(
        UUID(as_uuid=True),
        ForeignKey("analyses.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    source_file_id = Column(
        UUID(as_uuid=True),
        ForeignKey("analysis_files.id", ondelete="CASCADE"),
        nullable=False,
    )
    target_file_id = Column(
        UUID(as_uuid=True),
        ForeignKey("analysis_files.id", ondelete="CASCADE"),
        nullable=False,
    )
    dependency_type = Column(String, nullable=False)  # e.g. 'import', 'call', 'inherit'
    symbol = Column(String, nullable=True)            # specific imported symbol if known
    confidence = Column(Float, nullable=True)         # 0.0–1.0 resolver confidence
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    # Relationships
    analysis = relationship("Analysis", back_populates="dependencies")
    source_file = relationship(
        "AnalysisFile",
        foreign_keys=[source_file_id],
        back_populates="source_deps",
    )
    target_file = relationship(
        "AnalysisFile",
        foreign_keys=[target_file_id],
        back_populates="target_deps",
    )
