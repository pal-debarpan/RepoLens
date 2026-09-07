import enum
import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, DateTime, Enum, ForeignKey, Integer, Float, Text, JSON, Index
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship

from app.db.base import Base


class AnalysisStatus(str, enum.Enum):
    PENDING = "PENDING"
    RUNNING = "RUNNING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


JSON_TYPE = JSON().with_variant(JSONB, "postgresql")


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
        String,  # Supabase stores as TEXT, not a PG enum type
        nullable=False,
        default=AnalysisStatus.PENDING,
        index=True,
    )
    error_message = Column(Text, nullable=True)

    commit_sha = Column(String, nullable=True)

    # Scalar result columns (added in migration 004)
    file_count = Column(Integer, default=0, nullable=False)
    total_lines = Column(Integer, default=0, nullable=False)
    primary_language = Column(String, nullable=True)
    quality_score = Column(Float, nullable=True)
    blast_radius_max = Column(Float, nullable=True)
    blast_radius_avg = Column(Float, nullable=True)

    # Supabase has started_at; we use created_at as our primary creation timestamp
    started_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False, index=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    # JSON/JSONB payload columns (added in migration 004)
    summary = Column(JSON_TYPE, nullable=True)
    graph_data = Column(JSON_TYPE, nullable=True)
    quality_details = Column(JSON_TYPE, nullable=True)
    testing_details = Column(JSON_TYPE, nullable=True)
    vulnerability_details = Column(JSON_TYPE, nullable=True)  # OSV vulnerability scan results
    sbom_details = Column(JSON_TYPE, nullable=True)            # CycloneDX 1.5 JSON SBOM payload

    # Relationships
    repository = relationship("Repository", back_populates="analyses")
    findings = relationship("Finding", back_populates="analysis", cascade="all, delete-orphan")

    # Child table relationships (normalized storage, added in migration 004)
    analysis_files = relationship("AnalysisFile", back_populates="analysis", cascade="all, delete-orphan")
    analysis_findings = relationship("AnalysisFinding", back_populates="analysis", cascade="all, delete-orphan")
    graph_nodes = relationship("AnalysisGraphNode", back_populates="analysis", cascade="all, delete-orphan")
    graph_edges = relationship("AnalysisGraphEdge", back_populates="analysis", cascade="all, delete-orphan")
    quality_scores = relationship("AnalysisQualityScore", back_populates="analysis", cascade="all, delete-orphan")
    dependencies = relationship("AnalysisDependency", back_populates="analysis", cascade="all, delete-orphan")
