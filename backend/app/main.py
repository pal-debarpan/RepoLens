import sys
from pathlib import Path

# Ensure backend directory is in sys.path for direct module execution
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from fastapi import FastAPI

from app.api.v1.router import api_router
from app.core.config import settings
from app.schemas.common import HealthResponse, RootResponse

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Repolens backend service for repository analysis, blast-radius estimation, and code insights.",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# Mount API v1 router
app.include_router(api_router, prefix=settings.API_V1_STR)


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
    """Health check endpoint confirming service status."""
    return HealthResponse(
        status="healthy",
        environment=settings.ENVIRONMENT,
        version=settings.APP_VERSION,
    )
