from datetime import datetime
from uuid import UUID

from src.core.schemas.base_schema import BaseSchema


class UserSchema(BaseSchema):
    id: UUID
    username: str
    email: str
    password_hash: str
    avatar_url: str | None
    joined_at: datetime


class UserPublicSchema(BaseSchema):
    id: UUID
    username: str
    email: str
    avatar_url: str | None
    joined_at: datetime
