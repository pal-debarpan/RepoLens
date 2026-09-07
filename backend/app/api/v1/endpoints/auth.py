import logging
import uuid
from typing import Any
import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import SignupRequest, LoginRequest, AuthResponse

logger = logging.getLogger(__name__)

router = APIRouter()


def _get_supabase_auth_headers() -> dict[str, str]:
    if not settings.SUPABASE_URL or not settings.SUPABASE_ANON_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Supabase Auth is not configured on the server (missing URL or key).",
        )
    return {
        "apikey": settings.SUPABASE_ANON_KEY,
        "Authorization": f"Bearer {settings.SUPABASE_ANON_KEY}",
        "Content-Type": "application/json",
    }


@router.post(
    "/signup",
    response_model=AuthResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user with Supabase Auth",
    description="Thin wrapper around Supabase Auth signup. Automatically provisions user profile in the database.",
)
def signup(
    body: SignupRequest,
    db: Session = Depends(get_db),
) -> AuthResponse:
    headers = _get_supabase_auth_headers()
    signup_url = f"{settings.SUPABASE_URL.rstrip('/')}/auth/v1/signup"
    payload: dict[str, Any] = {
        "email": body.email,
        "password": body.password,
    }
    if body.full_name:
        payload["data"] = {"full_name": body.full_name}

    try:
        with httpx.Client(timeout=15.0) as client:
            resp = client.post(signup_url, json=payload, headers=headers)
    except httpx.RequestError as exc:
        logger.exception("Failed to connect to Supabase Auth during signup")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Could not reach authentication service.",
        ) from exc

    if resp.status_code not in (200, 201):
        try:
            err_data = resp.json()
            err_msg = err_data.get("msg") or err_data.get("message") or err_data.get("error_description") or "Signup failed"
        except Exception:
            err_msg = f"Signup failed with status {resp.status_code}"
        raise HTTPException(status_code=resp.status_code if resp.status_code < 500 else 400, detail=err_msg)

    data = resp.json()
    user_data = data.get("user") or {}
    user_id_str = user_data.get("id")

    # Optionally sync user into profiles table
    if user_id_str:
        try:
            user_uuid = uuid.UUID(user_id_str)
            existing_user = db.get(User, user_uuid)
            if not existing_user:
                new_user = User(
                    id=user_uuid,
                    email=body.email,
                    display_name=body.full_name or body.email.split("@")[0],
                    provider="email",
                )
                db.add(new_user)
                db.commit()
        except Exception as e:
            logger.warning("Failed to auto-create profile during signup (will be created on first login): %s", e)
            db.rollback()

    access_token = data.get("access_token")
    return AuthResponse(
        access_token=access_token,
        token_type=data.get("token_type", "bearer"),
        expires_in=data.get("expires_in"),
        user=user_data,
        message="Signup successful. Check your email for confirmation if email confirmation is enabled in your Supabase project." if not access_token else "Signup successful.",
    )


@router.post(
    "/login",
    response_model=AuthResponse,
    summary="Authenticate a user with Supabase Auth",
    description="Thin wrapper around Supabase Auth password login. Returns JWT bearer access token.",
)
def login(
    body: LoginRequest,
    db: Session = Depends(get_db),
) -> AuthResponse:
    headers = _get_supabase_auth_headers()
    token_url = f"{settings.SUPABASE_URL.rstrip('/')}/auth/v1/token?grant_type=password"
    payload = {
        "email": body.email,
        "password": body.password,
    }

    try:
        with httpx.Client(timeout=15.0) as client:
            resp = client.post(token_url, json=payload, headers=headers)
    except httpx.RequestError as exc:
        logger.exception("Failed to connect to Supabase Auth during login")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Could not reach authentication service.",
        ) from exc

    if resp.status_code != 200:
        try:
            err_data = resp.json()
            err_msg = err_data.get("error_description") or err_data.get("msg") or err_data.get("message") or "Invalid login credentials."
        except Exception:
            err_msg = "Invalid login credentials."
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=err_msg)

    data = resp.json()
    user_data = data.get("user") or {}
    user_id_str = user_data.get("id")

    # Update or create profile in DB on login
    if user_id_str:
        try:
            user_uuid = uuid.UUID(user_id_str)
            user = db.get(User, user_uuid)
            user_meta = user_data.get("user_metadata", {})
            full_name = user_meta.get("full_name") or user_data.get("email", "").split("@")[0]
            if not user:
                user = User(
                    id=user_uuid,
                    email=body.email,
                    display_name=full_name,
                    provider="email",
                )
                db.add(user)
            else:
                user.email = body.email
                if not user.display_name and full_name:
                    user.display_name = full_name
            db.commit()
        except Exception as e:
            logger.warning("Failed to sync profile during login: %s", e)
            db.rollback()

    return AuthResponse(
        access_token=data.get("access_token"),
        token_type=data.get("token_type", "bearer"),
        expires_in=data.get("expires_in"),
        user=user_data,
        message="Login successful.",
    )
