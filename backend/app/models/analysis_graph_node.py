"""SQLAlchemy model for analysis_graph_nodes table."""
import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, DateTime, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship

from app.db.base import Base


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


JSON_TYPE = JSON().with_variant(JSONB, "postgresql")


class AnalysisGraphNode(Base):
    """
    A node in the dependency graph for an analysis run.
    Maps to the `analysis_graph_nodes` table in Supabase.
    """
    __tablename__ = "analysis_graph_nodes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    analysis_id = Column(
        UUID(as_uuid=True),
        ForeignKey("analyses.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    # Optional FK to the corresponding analysis_files row
    file_id = Column(
        UUID(as_uuid=True),
        ForeignKey("analysis_files.id", ondelete="SET NULL"),
        nullable=True,
    )
    node_key = Column(String, nullable=False)   # unique node identifier within the analysis (e.g. rel_path)
    label = Column(String, nullable=False)
    node_type = Column(String, nullable=False)  # e.g. 'file', 'module', 'package'
    node_metadata = Column("metadata", JSON_TYPE, nullable=False, default=dict)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    # Relationships
    analysis = relationship("Analysis", back_populates="graph_nodes")
    file = relationship("AnalysisFile", back_populates="graph_nodes")
    outgoing_edges = relationship(
        "AnalysisGraphEdge",
        foreign_keys="AnalysisGraphEdge.source_node_id",
        back_populates="source_node",
        cascade="all, delete-orphan",
    )
    incoming_edges = relationship(
        "AnalysisGraphEdge",
        foreign_keys="AnalysisGraphEdge.target_node_id",
        back_populates="target_node",
    )
