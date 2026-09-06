from pydantic import BaseModel


class HealthResponse(BaseModel):
    status: str = "healthy"
    service: str = "repolens-backend"
    version: str
    environment: str


class RootResponse(BaseModel):
    message: str
    app_name: str
    version: str
    docs_url: str


class ErrorResponse(BaseModel):
    detail: str
