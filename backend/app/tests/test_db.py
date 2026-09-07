from unittest.mock import MagicMock, patch
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.exc import OperationalError
from sqlalchemy.orm import DeclarativeBase, Session

from app.core.config import Settings
from app.db.base import Base
from app.db.session import (
    check_db_connectivity,
    get_db,
    get_engine,
    get_session_factory,
    reset_db_state,
)


def test_database_url_normalization() -> None:
    """Verify that postgres connection strings are normalized to postgresql+psycopg."""
    test_settings_old_style = Settings(
        DATABASE_URL="postgres://user:pass@localhost:5432/dbname"
    )
    assert test_settings_old_style.DATABASE_URL == "postgresql+psycopg://user:pass@localhost:5432/dbname"

    test_settings_standard = Settings(
        DATABASE_URL="postgresql://user:pass@localhost:5432/dbname"
    )
    assert test_settings_standard.DATABASE_URL == "postgresql+psycopg://user:pass@localhost:5432/dbname"

    test_settings_psycopg = Settings(
        DATABASE_URL="postgresql+psycopg://user:pass@localhost:5432/dbname"
    )
    assert test_settings_psycopg.DATABASE_URL == "postgresql+psycopg://user:pass@localhost:5432/dbname"


def test_declarative_base() -> None:
    """Verify DeclarativeBase foundation is established for future models."""
    assert issubclass(Base, DeclarativeBase)
    assert hasattr(Base, "metadata")


def test_missing_database_url_raises_runtime_error() -> None:
    """Verify get_engine raises clear RuntimeError when DATABASE_URL is not set."""
    reset_db_state()
    with patch("app.db.session.settings.DATABASE_URL", None), \
         patch.dict("os.environ", {"ALLOW_IN_MEMORY_DB": "false"}):
        with pytest.raises(RuntimeError) as exc_info:
            get_engine()
        assert "DATABASE_URL is not configured" in str(exc_info.value)
    reset_db_state()


def test_get_db_session_lifecycle() -> None:
    """Verify get_db yields a session and ensures it is reliably closed upon completion."""
    mock_session = MagicMock(spec=Session)
    mock_factory = MagicMock(return_value=mock_session)

    with patch("app.db.session.get_session_factory", return_value=mock_factory):
        generator = get_db()
        session = next(generator)
        assert session is mock_session
        assert mock_session.close.call_count == 0

        # Generator completion must invoke close() in finally block
        with pytest.raises(StopIteration):
            next(generator)

        mock_session.close.assert_called_once()


def test_check_db_connectivity_success() -> None:
    """Verify connectivity check succeeds with a valid engine executing SELECT 1."""
    test_engine = create_engine("sqlite:///:memory:")
    is_connected, error = check_db_connectivity(engine=test_engine)
    assert is_connected is True
    assert error is None


def test_check_db_connectivity_failure_handled_gracefully() -> None:
    """Verify connection errors are captured cleanly without exposing secrets or raising unhandled exceptions."""
    failing_engine = create_engine("sqlite:///non_existent_path/non_existent.db")
    with patch.object(failing_engine, "connect", side_effect=OperationalError("connection failed", None, None)):
        is_connected, error = check_db_connectivity(engine=failing_engine)
        assert is_connected is False
        assert "Database connectivity error" in str(error)


def test_health_endpoint_reports_not_configured_when_no_db(client: TestClient) -> None:
    """Verify health endpoint shows database as 'not_configured' when DATABASE_URL is unset."""
    with patch("app.main.settings.DATABASE_URL", None):
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["database"] == "not_configured"


def test_health_endpoint_reports_connected(client: TestClient) -> None:
    """Verify health endpoint reports 'connected' when database check succeeds."""
    with patch("app.main.settings.DATABASE_URL", "postgresql+psycopg://test:test@localhost:5432/test"):
        with patch("app.main.check_db_connectivity", return_value=(True, None)):
            response = client.get("/health")
            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "healthy"
            assert data["database"] == "connected"


def test_health_endpoint_reports_disconnected_without_500(client: TestClient) -> None:
    """Verify health endpoint returns 200 with 'disconnected' status when database is unreachable."""
    with patch("app.main.settings.DATABASE_URL", "postgresql+psycopg://test:test@localhost:5432/test"):
        with patch("app.main.check_db_connectivity", return_value=(False, "Connection timeout")):
            response = client.get("/health")
            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "healthy"
            assert data["database"] == "disconnected"
