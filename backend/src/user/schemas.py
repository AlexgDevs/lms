from datetime import datetime
from uuid import UUID

from pydantic import EmailStr

from src.core.schemas.base_schema import BaseSchema


class UserSchema(BaseSchema):
    id: UUID
    username: str
    email: str
    password_hash: str
    avatar_url: str | None
    joined_at: datetime
    is_staff: bool = False


class UserPublicSchema(BaseSchema):
    id: UUID
    username: str
    email: str
    avatar_url: str | None
    joined_at: datetime


class UserMeSchema(UserPublicSchema):
    is_staff: bool = False


class UserUpdateRequestSchema(BaseSchema):
    username: str | None = None
    email: EmailStr | None = None
    avatar_url: str | None = None
