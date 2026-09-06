import asyncio
import uuid
import jwt
import pytest
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials

from app.core.auth import (
    decode_supabase_jwt,
    get_current_user_optional,
    get_current_user_required,
    AuthenticatedUser,
)
from app.core.config import settings


def test_decode_valid_jwt():
    user_id = str(uuid.uuid4())
    payload = {
        "sub": user_id,
        "email": "dev@repolens.io",
        "role": "authenticated",
    }
    secret = settings.SUPABASE_JWT_SECRET or "test-secret"
    token = jwt.encode(payload, secret, algorithm="HS256")

    decoded = decode_supabase_jwt(token)
    assert decoded["sub"] == user_id
    assert decoded["email"] == "dev@repolens.io"


def test_decode_invalid_jwt():
    with pytest.raises(HTTPException) as exc_info:
        decode_supabase_jwt("not.a.valid.jwt.token")
    assert exc_info.value.status_code == 401


def test_get_current_user_optional_none():
    user = asyncio.run(get_current_user_optional(None))
    assert user is None


def test_get_current_user_optional_valid():
    user_id = str(uuid.uuid4())
    payload = {"sub": user_id, "email": "test@repolens.io"}
    secret = settings.SUPABASE_JWT_SECRET or "test-secret"
    token = jwt.encode(payload, secret, algorithm="HS256")
    creds = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)

    user = asyncio.run(get_current_user_optional(creds))
    assert user is not None
    assert str(user.id) == user_id
    assert user.email == "test@repolens.io"


def test_get_current_user_required_unauthorized():
    with pytest.raises(HTTPException) as exc_info:
        asyncio.run(get_current_user_required(None))
    assert exc_info.value.status_code == 401
