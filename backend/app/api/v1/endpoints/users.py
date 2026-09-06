import uuid
import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.auth import AuthenticatedUser, get_current_user_required
from app.db.session import get_db
from app.models.user import User
from app.schemas.user import UserResponse, UserUpsertRequest

logger = logging.getLogger(__name__)
router = APIRouter()


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


# ─── POST /users/me ────────────────────────────────────────────────────────────

@router.post(
    "/me",
    response_model=UserResponse,
    summary="Register or update the current user on login",
    description=(
        "Upserts a user row using the identity from the verified Supabase JWT. "
        "Call this endpoint immediately after a successful login. "
        "The user's `id` and `email` come exclusively from the JWT — the request "
        "body cannot override them. `last_seen_at` is always refreshed."
    ),
)
def upsert_current_user(
    body: UserUpsertRequest,
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user_required),
) -> UserResponse:
    """
    Security guarantees:
    - `id` is the verified JWT `sub` claim — cannot be spoofed via request body.
    - `email` is the verified JWT `email` claim — cannot be spoofed via request body.
    - Only `display_name`, `avatar_url`, and `provider` can be updated by the user.
    """
    if not current_user.email:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="JWT does not contain an email claim. Cannot create user record.",
        )

    user_id = uuid.UUID(str(current_user.id))
    now = _utc_now()

    user = db.get(User, user_id)

    if user is None:
        # First login — create the row
        user = User(
            id=user_id,
            email=current_user.email,
            display_name=body.display_name,
            avatar_url=body.avatar_url,
            provider=body.provider or "email",
            created_at=now,
            last_seen_at=now,
        )
        db.add(user)
        logger.info("Created user record for %s", user_id)
    else:
        # Subsequent login — update mutable fields and refresh last_seen_at
        if body.display_name is not None:
            user.display_name = body.display_name
        if body.avatar_url is not None:
            user.avatar_url = body.avatar_url
        if body.provider is not None:
            user.provider = body.provider
        user.last_seen_at = now
        logger.info("Updated user record for %s (last_seen_at refreshed)", user_id)

    db.commit()
    db.refresh(user)
    return UserResponse.model_validate(user)


# ─── GET /users/me ─────────────────────────────────────────────────────────────

@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get the current user's profile",
    description=(
        "Returns the authenticated user's stored profile. "
        "Returns 404 if the user has never called POST /users/me."
    ),
)
def get_current_user_profile(
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user_required),
) -> UserResponse:
    user_id = uuid.UUID(str(current_user.id))
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User profile not found. Call POST /users/me to register.",
        )
    return UserResponse.model_validate(user)
