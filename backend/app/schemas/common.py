from pydantic import BaseModel


class HealthResponse(BaseModel):
    status: str = "healthy"
    environment: str
    version: str


class RootResponse(BaseModel):
    message: str
    app_name: str
    version: str
    docs_url: str
