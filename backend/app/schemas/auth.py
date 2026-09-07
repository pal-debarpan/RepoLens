from typing import Any, Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field


class SignupRequest(BaseModel):
    email: EmailStr = Field(..., description="User's email address")
    password: str = Field(..., min_length=6, description="Password (at least 6 characters)")
    full_name: Optional[str] = Field(None, description="User's display or full name")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "email": "developer@example.com",
                "password": "securepassword123",
                "full_name": "RepoLens Developer",
            }
        }
    )


class LoginRequest(BaseModel):
    email: EmailStr = Field(..., description="User's email address")
    password: str = Field(..., description="User's password")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "email": "developer@example.com",
                "password": "securepassword123",
            }
        }
    )


class AuthResponse(BaseModel):
    access_token: Optional[str] = Field(None, description="JWT access token from Supabase Auth")
    token_type: str = Field("bearer", description="Token type")
    expires_in: Optional[int] = Field(None, description="Token validity in seconds")
    user: Optional[dict[str, Any]] = Field(None, description="Authenticated user metadata")
    message: Optional[str] = Field(None, description="Informational message (e.g. confirmation required)")
