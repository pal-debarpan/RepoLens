from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class UserUpsertRequest(BaseModel):
    """
    Payload the frontend sends on login to register/update the user record.
    The user's `id` and `email` are taken from the verified JWT — they cannot
    be supplied or overridden via this request body.
    """

    display_name: Optional[str] = Field(None, max_length=255)
    avatar_url: Optional[str] = Field(None, max_length=2048)
    # Provider as reported by the Supabase session (informational only)
    provider: Optional[str] = Field(None, max_length=64)


class UserResponse(BaseModel):
    """Public representation of a user record. Never exposes internal secrets."""

    id: UUID
    email: Optional[str] = None     # nullable until migration 004 adds the column
    display_name: Optional[str] = None
    avatar_url: Optional[str] = None
    provider: Optional[str] = None  # nullable until migration 004 adds the column
    created_at: datetime
    last_seen_at: datetime

    model_config = ConfigDict(from_attributes=True)
