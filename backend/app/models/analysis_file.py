"""SQLAlchemy model for analysis_files table."""
import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, Boolean, Integer, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.base import Base


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class AnalysisFile(Base):
    """
    Represents a single scanned file within an analysis run.
    Maps to the `analysis_files` table in Supabase.
    """
    __tablename__ = "analysis_files"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    analysis_id = Column(
        UUID(as_uuid=True),
        ForeignKey("analyses.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    path = Column(String, nullable=False)           # relative file path in workspace
    language = Column(String, nullable=True)         # detected programming language
    file_type = Column(String, nullable=True)        # e.g. 'source', 'config', 'test'
    lines_of_code = Column(Integer, nullable=True)
    is_entry_point = Column(Boolean, nullable=False, default=False)
    is_test_file = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    # Relationships
    analysis = relationship("Analysis", back_populates="analysis_files")
    findings = relationship("AnalysisFinding", back_populates="file")
    graph_nodes = relationship("AnalysisGraphNode", back_populates="file")
    source_deps = relationship(
        "AnalysisDependency",
        foreign_keys="AnalysisDependency.source_file_id",
        back_populates="source_file",
    )
    target_deps = relationship(
        "AnalysisDependency",
        foreign_keys="AnalysisDependency.target_file_id",
        back_populates="target_file",
    )
