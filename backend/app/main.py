import logging
import sys
from contextlib import asynccontextmanager
from pathlib import Path
from typing import AsyncGenerator

# Ensure backend directory is in sys.path for direct module execution
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.api.v1.router import api_router
from app.api.v1.endpoints.auth import router as auth_router
from app.core.config import settings
from app.db.session import check_db_connectivity, reset_db_state
from app.schemas.common import HealthResponse, RootResponse

logger = logging.getLogger("repolens.main")


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan context manager.

    Acts as a clean lifecycle extension point for resources
    (e.g., database connection pool, external clients, analysis engines).
    """
    # Startup phase
    if settings.DATABASE_URL:
        is_connected, error = check_db_connectivity()
        if is_connected:
            logger.info("Database connection established successfully.")
            try:
                from app.db.apply_migrations import apply_migrations
                apply_migrations()
            except Exception as e:
                logger.warning("Startup migration check encountered notice: %s", e)
        else:
            logger.warning("Database configured but connectivity check failed: %s", error)
    else:
        logger.info("Database not configured (DATABASE_URL is not set).")

    yield

    # Shutdown phase: release database engine resources cleanly
    reset_db_state()


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description=(
        "Repolens backend service for repository intelligence, "
        "blast-radius estimation, and architectural code insights."
    ),
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)

# Global unhandled exception handler: logs full traceback to terminal, returns clean JSON to client
@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    if isinstance(exc, StarletteHTTPException):
        return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})
    logger.exception("Unhandled error processing request %s %s: %s", request.method, request.url.path, exc)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
    )

# Configuration-driven CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["*"],
)

# Mount root-level auth router (/auth/signup, /auth/login)
app.include_router(auth_router, prefix="/auth", tags=["auth"])

# Mount versioned API router (/api/v1/...)
app.include_router(api_router, prefix=settings.API_V1_PREFIX)


@app.get("/", response_model=RootResponse, tags=["General"])
def root() -> RootResponse:
    """Root endpoint confirming the Repolens API is operational."""
    return RootResponse(
        message="Repolens API is running",
        app_name=settings.APP_NAME,
        version=settings.APP_VERSION,
        docs_url="/docs",
    )


@app.get("/health", response_model=HealthResponse, tags=["Health"])
def health_check() -> HealthResponse:
    """Health check endpoint confirming service and database operational status."""
    db_status = "not_configured"
    if settings.DATABASE_URL:
        is_connected, _ = check_db_connectivity()
        db_status = "connected" if is_connected else "disconnected"

    return HealthResponse(
        status="healthy",
        service="repolens-backend",
        version=settings.APP_VERSION,
        environment=settings.ENVIRONMENT,
        database=db_status,
    )
