from fastapi import APIRouter

from app.api.v1.endpoints import analyses, repositories, users

api_router = APIRouter()
api_router.include_router(repositories.router, prefix="/repositories", tags=["repositories"])
api_router.include_router(analyses.router, prefix="/analyses", tags=["analyses"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
