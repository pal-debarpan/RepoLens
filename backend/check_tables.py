"""Inspect all analysis child tables."""
import sys
sys.path.insert(0, ".")

from app.db.session import get_engine
from sqlalchemy import text

engine = get_engine()
with engine.connect() as conn:
    tables = [
        "analysis_dependencies", "analysis_files", "analysis_findings",
        "analysis_graph_edges", "analysis_graph_nodes", "analysis_quality_scores"
    ]
    for tbl in tables:
        res = conn.execute(text(
            f"SELECT column_name, data_type, is_nullable "
            f"FROM information_schema.columns "
            f"WHERE table_schema='public' AND table_name='{tbl}' "
            f"ORDER BY ordinal_position"
        ))
        cols = [(r[0], r[1], r[2]) for r in res]
        print(f"\n{tbl.upper()} COLUMNS:")
        for col in cols:
            print(f"  {col[0]:35s} {col[1]:25s} nullable={col[2]}")
