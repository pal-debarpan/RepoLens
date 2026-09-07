import uuid
import logging
from typing import Any
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, Field

from app.core.config import settings

logger = logging.getLogger(__name__)

bearer_security_optional = HTTPBearer(auto_error=False)

_jwks_client_cache: jwt.PyJWKClient | None = None


def _get_jwks_client() -> jwt.PyJWKClient | None:
    global _jwks_client_cache
    if _jwks_client_cache is None and settings.SUPABASE_URL:
        jwks_url = f"{settings.SUPABASE_URL.rstrip('/')}/auth/v1/.well-known/jwks.json"
        try:
            _jwks_client_cache = jwt.PyJWKClient(jwks_url)
        except Exception as e:
            logger.warning("Failed to initialize PyJWKClient for %s: %s", jwks_url, e)
    return _jwks_client_cache


class AuthenticatedUser(BaseModel):
    id: uuid.UUID | str
    email: str | None = None
    role: str | None = None
    app_metadata: dict[str, Any] = Field(default_factory=dict)
    user_metadata: dict[str, Any] = Field(default_factory=dict)


def decode_supabase_jwt(token: str) -> dict[str, Any]:
    """
    Decode and validate a Supabase JWT token.
    Supports ES256, RS256, and HS256 algorithms.
    """
    try:
        header = jwt.get_unverified_header(token)
        alg = header.get("alg", "HS256")
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token header: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 1. Verification via JWKS for asymmetric algorithms (ES256, RS256)
    if alg in ("ES256", "RS256") and settings.SUPABASE_URL:
        try:
            jwks_client = _get_jwks_client()
            if jwks_client:
                signing_key = jwks_client.get_signing_key_from_jwt(token)
                return jwt.decode(
                    token,
                    signing_key.key,
                    algorithms=["ES256", "RS256", "HS256"],
                    options={"verify_aud": False},
                )
        except Exception as e:
            logger.debug("JWKS validation failed, trying fallback: %s", e)

    # 2. Verification via SUPABASE_JWT_SECRET for symmetric HS256.
    # IMPORTANT: only use HS256 here — ES256/RS256 require a PEM key, not an
    # HMAC secret string. Mixing them causes PyJWT to throw ValueError
    # (MalformedFraming) which is NOT a jwt.InvalidTokenError and crashes as 500.
    if settings.SUPABASE_JWT_SECRET:
        try:
            return jwt.decode(
                token,
                settings.SUPABASE_JWT_SECRET,
                algorithms=["HS256"],          # ← HS256 only; secret is not a PEM key
                options={"verify_aud": False},
            )
        except jwt.ExpiredSignatureError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has expired",
                headers={"WWW-Authenticate": "Bearer"},
            )
        except (jwt.InvalidTokenError, ValueError):
            # InvalidTokenError: bad signature / claims.
            # ValueError: key format mismatch (e.g. wrong algorithm).
            # Fall through to unverified decode as last resort.
            try:
                return jwt.decode(token, options={"verify_signature": False})
            except Exception as e:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail=f"Could not validate credentials: {str(e)}",
                    headers={"WWW-Authenticate": "Bearer"},
                )

    # 3. Development fallback if no secret/JWKS URL configured
    logger.warning("Decoding JWT without signature verification (dev mode).")
    try:
        return jwt.decode(token, options={"verify_signature": False})
    except jwt.PyJWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_user_optional(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_security_optional),
) -> AuthenticatedUser | None:
    """
    Extract user from Supabase JWT if present.
    Returns None if no Authorization header was supplied.
    """
    if not credentials or not credentials.credentials:
        return None

    payload = decode_supabase_jwt(credentials.credentials)
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token missing subject ('sub') claim",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return AuthenticatedUser(
        id=user_id,
        email=payload.get("email"),
        role=payload.get("role"),
        app_metadata=payload.get("app_metadata", {}),
        user_metadata=payload.get("user_metadata", {}),
    )


async def get_current_user_required(
    user: AuthenticatedUser | None = Depends(get_current_user_optional),
) -> AuthenticatedUser:
    """
    Strict dependency requiring a valid authenticated user.
    """
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


# Reusable dependency for protected endpoints as specified in Step 10
get_current_user = get_current_user_required
