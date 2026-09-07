import os
import sys
import logging
from pathlib import Path
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def find_migrations_dir() -> Path:
    candidates = [
        Path("supabase/migrations"),
        Path("../supabase/migrations"),
        Path("d:/RepoLens/supabase/migrations"),
    ]
    for c in candidates:
        if c.exists() and c.is_dir():
            return c
    raise FileNotFoundError("Supabase migrations directory not found.")


def apply_migrations():
    load_dotenv(".env")
    load_dotenv("backend/.env")

    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        logger.error("DATABASE_URL not set in environment.")
        sys.exit(1)

    migrations_dir = find_migrations_dir()
    logger.info("Using migrations directory: %s", migrations_dir)

    migration_files = sorted(migrations_dir.glob("*.sql"))
    if not migration_files:
        logger.error("No migration files found in %s", migrations_dir)
        sys.exit(1)

    logger.info("Found %d migration file(s): %s", len(migration_files), [f.name for f in migration_files])
    logger.info("Connecting to Supabase PostgreSQL database...")
    engine = create_engine(db_url)

    with engine.begin() as conn:
        for mf in migration_files:
            logger.info("Executing migration: %s", mf.name)
            with open(mf, "r", encoding="utf-8") as f:
                sql_content = f.read()

            # Execute the migration script
            # In PostgreSQL / psycopg, raw connection cursor or text() executes multi-statement scripts
            raw_conn = conn.connection
            with raw_conn.cursor() as cursor:
                cursor.execute(sql_content)
            logger.info("Successfully executed %s", mf.name)

    with engine.connect() as conn:
        result = conn.execute(text(
            "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;"
        ))
        tables = [row[0] for row in result]
        logger.info("Public tables currently in Supabase database: %s", tables)

        required = [
            "profiles",
            "repositories",
            "analyses",
            "findings",
            "analysis_files",
            "analysis_findings",
            "analysis_graph_nodes",
            "analysis_graph_edges",
            "analysis_quality_scores",
            "analysis_dependencies",
        ]
        missing = [t for t in required if t not in tables]
        if missing:
            logger.error("Missing required application tables after migration: %s", missing)
            sys.exit(1)

        logger.info("Verification PASSED! All %d required application tables exist in Supabase DB: %s", len(required), required)


if __name__ == "__main__":
    apply_migrations()
