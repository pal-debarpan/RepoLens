"""SQLAlchemy model for analysis_graph_edges table."""
import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, Float, String, DateTime, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship

from app.db.base import Base


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


JSON_TYPE = JSON().with_variant(JSONB, "postgresql")


class AnalysisGraphEdge(Base):
    """
    A directed edge between two graph nodes in an analysis run.
    Maps to the `analysis_graph_edges` table in Supabase.
    """
    __tablename__ = "analysis_graph_edges"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    analysis_id = Column(
        UUID(as_uuid=True),
        ForeignKey("analyses.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    source_node_id = Column(
        UUID(as_uuid=True),
        ForeignKey("analysis_graph_nodes.id", ondelete="CASCADE"),
        nullable=False,
    )
    target_node_id = Column(
        UUID(as_uuid=True),
        ForeignKey("analysis_graph_nodes.id", ondelete="CASCADE"),
        nullable=False,
    )
    edge_type = Column(String, nullable=False)  # e.g. 'imports', 'calls', 'extends'
    weight = Column(Float, nullable=True)
    edge_metadata = Column("metadata", JSON_TYPE, nullable=False, default=dict)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    # Relationships
    analysis = relationship("Analysis", back_populates="graph_edges")
    source_node = relationship(
        "AnalysisGraphNode",
        foreign_keys=[source_node_id],
        back_populates="outgoing_edges",
    )
    target_node = relationship(
        "AnalysisGraphNode",
        foreign_keys=[target_node_id],
        back_populates="incoming_edges",
    )
