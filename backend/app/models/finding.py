import enum
import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, DateTime, Enum, ForeignKey, Integer, Text, JSON, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.base import Base


class FindingCategory(str, enum.Enum):
    ARCHITECTURE = "ARCHITECTURE"
    SECURITY = "SECURITY"
    DEPENDENCY = "DEPENDENCY"
    CODE_QUALITY = "CODE_QUALITY"


class FindingSeverity(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class Finding(Base):
    __tablename__ = "findings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    analysis_id = Column(
        UUID(as_uuid=True),
        ForeignKey("analyses.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    
    category = Column(
        Enum(FindingCategory, name="findingcategory", create_constraint=True),
        nullable=False,
        index=True,
    )
    severity = Column(
        Enum(FindingSeverity, name="findingseverity", create_constraint=True),
        nullable=False,
        index=True,
    )
    
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    file_path = Column(String, nullable=False, index=True)
    line_number = Column(Integer, nullable=True)
    evidence = Column(Text, nullable=True)  # Masked/sanitized code snippet
    suggested_fix = Column(Text, nullable=True)
    metadata_payload = Column(JSON, nullable=True)  # Contextual details
    
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    # Relationships
    analysis = relationship("Analysis", back_populates="findings")

    __table_args__ = (
        Index("ix_findings_analysis_category", "analysis_id", "category"),
        Index("ix_findings_analysis_severity", "analysis_id", "severity"),
    )
