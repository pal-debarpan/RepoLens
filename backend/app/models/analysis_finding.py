"""SQLAlchemy model for analysis_findings table (normalized child table)."""
import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.base import Base


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class AnalysisFinding(Base):
    """
    Normalized finding record linked to an analysis and optionally a file.
    Maps to the `analysis_findings` table in Supabase.

    Note: this is distinct from the legacy `findings` table (mapped by app.models.finding).
    Both are populated during pipeline runs; this one links via file_id FK.
    """
    __tablename__ = "analysis_findings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    analysis_id = Column(
        UUID(as_uuid=True),
        ForeignKey("analyses.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    # Optional FK to analysis_files — NULL when no matching file row exists
    file_id = Column(
        UUID(as_uuid=True),
        ForeignKey("analysis_files.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    # Fallback text path for findings without a file_id (added in migration 004)
    file_path = Column(Text, nullable=True)

    category = Column(String, nullable=False, index=True)     # ARCHITECTURE|SECURITY|DEPENDENCY|CODE_QUALITY
    severity = Column(String, nullable=False, index=True)     # LOW|MEDIUM|HIGH|CRITICAL
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    evidence = Column(Text, nullable=True)
    recommendation = Column(Text, nullable=True)   # maps to suggested_fix from FindingCreate
    line_start = Column(Integer, nullable=True)    # maps to line_number from FindingCreate
    line_end = Column(Integer, nullable=True)
    rule_id = Column(String, nullable=True)        # optional rule identifier

    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    # Relationships
    analysis = relationship("Analysis", back_populates="analysis_findings")
    file = relationship("AnalysisFile", back_populates="findings")
