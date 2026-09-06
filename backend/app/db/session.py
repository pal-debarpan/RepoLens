import logging
from collections.abc import Generator
from typing import Any, Optional, Tuple
from sqlalchemy import Engine, create_engine, text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import settings

logger = logging.getLogger("repolens.db")

_engine: Optional[Engine] = None
_session_factory: Optional[sessionmaker[Session]] = None


def get_engine() -> Engine:
    """Obtain or initialize the reusable SQLAlchemy engine.

    Raises:
        RuntimeError: If DATABASE_URL is not configured.
    """
    global _engine
    if _engine is None:
        if not settings.DATABASE_URL:
            raise RuntimeError(
                "DATABASE_URL is not configured. Please set DATABASE_URL in your environment or .env file."
            )
        engine_kwargs: dict[str, Any] = {
            "pool_pre_ping": settings.DB_POOL_PRE_PING,
        }
        # SQLite (e.g. during isolated testing) does not support pool_size or max_overflow
        if not settings.DATABASE_URL.startswith("sqlite"):
            engine_kwargs["pool_size"] = settings.DB_POOL_SIZE
            engine_kwargs["max_overflow"] = settings.DB_MAX_OVERFLOW

        _engine = create_engine(settings.DATABASE_URL, **engine_kwargs)
    return _engine


def get_session_factory() -> sessionmaker[Session]:
    """Obtain or initialize the reusable session factory."""
    global _session_factory
    if _session_factory is None:
        engine = get_engine()
        _session_factory = sessionmaker(
            autocommit=False,
            autoflush=False,
            bind=engine,
        )
    return _session_factory


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency that yields a database session and safely closes it."""
    factory = get_session_factory()
    db = factory()
    try:
        yield db
    finally:
        db.close()


def check_db_connectivity(engine: Optional[Engine] = None) -> Tuple[bool, Optional[str]]:
    """Execute a safe, non-destructive connectivity check (SELECT 1).

    Returns:
        tuple[bool, Optional[str]]: (is_healthy, error_summary)
    """
    try:
        target_engine = engine or get_engine()
        with target_engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        return True, None
    except RuntimeError as exc:
        return False, str(exc)
    except SQLAlchemyError as exc:
        logger.warning("Database connectivity check failed: %s", type(exc).__name__)
        return False, f"Database connectivity error: {type(exc).__name__}"
    except Exception as exc:
        logger.warning("Unexpected error during database connectivity check: %s", type(exc).__name__)
        return False, f"Connection failure: {type(exc).__name__}"


def reset_db_state() -> None:
    """Reset the engine and session factory singletons (primarily used for test isolation)."""
    global _engine, _session_factory
    if _engine is not None:
        try:
            _engine.dispose()
        except Exception:
            pass
    _engine = None
    _session_factory = None


def SessionLocal() -> Session:
    """Convenience factory function for creating a new Session (e.g., in background threads)."""
    return get_session_factory()()
