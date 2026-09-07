import os
import sys
import logging
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def apply_migrations():
    load_dotenv(".env")
    load_dotenv("backend/.env")

    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        logger.error("DATABASE_URL not set in environment.")
        sys.exit(1)

    migration_file = os.path.join("supabase", "migrations", "001_initial_schema.sql")
    if not os.path.exists(migration_file):
        migration_file = os.path.join("..", "supabase", "migrations", "001_initial_schema.sql")

    if not os.path.exists(migration_file):
        logger.error("Migration file %s not found.", migration_file)
        sys.exit(1)

    logger.info("Reading migration file: %s", migration_file)
    with open(migration_file, "r", encoding="utf-8") as f:
        sql_content = f.read()

    logger.info("Connecting to Supabase PostgreSQL database...")
    engine = create_engine(db_url)

    with engine.begin() as conn:
        logger.info("Executing migration statements against Supabase database...")
        # Split statements by semicolon to execute individually
        statements = [stmt.strip() for stmt in sql_content.split(";") if stmt.strip()]
        for stmt in statements:
            # Filter out comments-only blocks
            lines = [l for l in stmt.split("\n") if not l.strip().startswith("--")]
            clean_stmt = "\n".join(lines).strip()
            if clean_stmt:
                conn.execute(text(clean_stmt))
        logger.info("Migration executed successfully!")

    with engine.connect() as conn:
        # Verify created tables in public schema
        result = conn.execute(text(
            "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;"
        ))
        tables = [row[0] for row in result]
        logger.info("Public tables currently in Supabase database: %s", tables)

        # Check required application tables
        required = ["profiles", "repositories", "analyses", "findings"]
        missing = [t for t in required if t not in tables]
        if missing:
            logger.error("Missing required application tables after migration: %s", missing)
            sys.exit(1)

        logger.info("Verification PASSED! All required application tables exist in Supabase DB: %s", required)

if __name__ == "__main__":
    apply_migrations()
