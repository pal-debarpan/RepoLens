from fastapi import APIRouter

from app.api.v1.endpoints import repositories

api_router = APIRouter()
api_router.include_router(repositories.router, prefix="/repositories", tags=["repositories"])

# Future milestone routers (e.g. analysis, graph, chat)
# will be mounted here using api_router.include_router(...)
