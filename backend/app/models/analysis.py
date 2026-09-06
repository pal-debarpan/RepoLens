import enum
import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, DateTime, Enum, ForeignKey, Integer, Float, Text, JSON, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.base import Base


class AnalysisStatus(str, enum.Enum):
    PENDING = "PENDING"
    RUNNING = "RUNNING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class Analysis(Base):
    __tablename__ = "analyses"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    repository_id = Column(
        UUID(as_uuid=True),
        ForeignKey("repositories.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id = Column(UUID(as_uuid=True), nullable=True, index=True)
    
    status = Column(
        Enum(AnalysisStatus, name="analysisstatus", create_constraint=True),
        nullable=False,
        default=AnalysisStatus.PENDING,
        index=True,
    )
    error_message = Column(Text, nullable=True)
    
    commit_sha = Column(String, nullable=True)
    file_count = Column(Integer, default=0, nullable=False)
    total_lines = Column(Integer, default=0, nullable=False)
    primary_language = Column(String, nullable=True)
    
    quality_score = Column(Float, nullable=True)
    blast_radius_max = Column(Float, nullable=True)
    blast_radius_avg = Column(Float, nullable=True)
    
    # Detailed payloads
    summary = Column(JSON, nullable=True)
    graph_data = Column(JSON, nullable=True)
    quality_details = Column(JSON, nullable=True)
    testing_details = Column(JSON, nullable=True)
    
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False, index=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    repository = relationship("Repository", back_populates="analyses")
    findings = relationship("Finding", back_populates="analysis", cascade="all, delete-orphan")
