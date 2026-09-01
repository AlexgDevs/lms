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
    is_active: bool = True
    is_staff: bool = False
    ai_course_generations: int = 0
    is_verified: bool = False
    is_founder: bool = False
    founder_at: datetime | None = None
    notifications_enabled: bool = True


class AiGenerationQuotaSchema(BaseSchema):
    used: int
    limit: int
    remaining: int


class UserPublicSchema(BaseSchema):
    id: UUID
    username: str
    avatar_url: str | None
    joined_at: datetime


class UserMeSchema(UserPublicSchema):
    email: str
    is_staff: bool = False
    is_verified: bool = False
    is_founder: bool = False
    founder_at: datetime | None = None
    notifications_enabled: bool = True


class UserUpdateRequestSchema(BaseSchema):
    username: str | None = None
    email: EmailStr | None = None
    avatar_url: str | None = None
    notifications_enabled: bool | None = None


class UserVerifyUpdateSchema(BaseSchema):
    is_verified: bool
    email_verified_at: datetime | None


class UserPasswordUpdateSchema(BaseSchema):
    password_hash: str
