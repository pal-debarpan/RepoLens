"""SQLAlchemy model for analysis_quality_scores table."""
import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, Numeric, DateTime, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship

from app.db.base import Base


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


JSON_TYPE = JSON().with_variant(JSONB, "postgresql")


class AnalysisQualityScore(Base):
    """
    ISO/IEC 25010-aligned quality score breakdown for an analysis run.
    Maps to the `analysis_quality_scores` table in Supabase.
    One row per analysis.
    """
    __tablename__ = "analysis_quality_scores"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    analysis_id = Column(
        UUID(as_uuid=True),
        ForeignKey("analyses.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    overall_score = Column(Numeric(5, 2), nullable=True)

    # ISO/IEC 25010:2023 characteristics
    functional_suitability = Column(Numeric(5, 2), nullable=True)
    performance_efficiency = Column(Numeric(5, 2), nullable=True)
    compatibility = Column(Numeric(5, 2), nullable=True)
    interaction_capability = Column(Numeric(5, 2), nullable=True)
    reliability = Column(Numeric(5, 2), nullable=True)
    security = Column(Numeric(5, 2), nullable=True)
    maintainability = Column(Numeric(5, 2), nullable=True)
    flexibility = Column(Numeric(5, 2), nullable=True)
    safety = Column(Numeric(5, 2), nullable=True)

    # JSON detail payloads
    limitations = Column(JSON_TYPE, nullable=False, default=list)
    evidence = Column(JSON_TYPE, nullable=False, default=dict)

    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    # Relationships
    analysis = relationship("Analysis", back_populates="quality_scores")
