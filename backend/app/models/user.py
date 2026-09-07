import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, String, Text
from sqlalchemy.dialects.postgresql import UUID

from app.db.base import Base


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    """
    Application profile record linked 1:1 with Supabase auth.users entry.

    The `id` is the UUID from the Supabase JWT `sub` claim — it is never
    auto-generated here; we always receive it from the verified token.

    Security notes:
    - This table does NOT store passwords, hashes, or sessions.
    - Authentication is fully delegated to Supabase Auth.
    - The `email` column is populated from the verified JWT; it cannot be
      spoofed because the JWT is signed by Supabase.
    """

    __tablename__ = "profiles"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
    )
    email = Column(String(320), unique=True, nullable=False, index=True)
    display_name = Column(String(255), nullable=True)
    avatar_url = Column(Text, nullable=True)
    provider = Column(String(64), nullable=False, server_default="email")

    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    last_seen_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)


# Alias for code compatibility
Profile = User
