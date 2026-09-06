from fastapi import APIRouter

from app.api.v1.endpoints import repositories, analyses

api_router = APIRouter()
api_router.include_router(repositories.router, prefix="/repositories", tags=["repositories"])
api_router.include_router(analyses.router, prefix="/analyses", tags=["analyses"])
