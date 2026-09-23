from dataclasses import dataclass
from datetime import datetime
from uuid import UUID

from pydantic import EmailStr, Field

from src.core.schemas import BaseSchema
from src.core.schemas.limits import (
    EMAIL_MAX,
    JWT_MAX,
    PASSWORD_MAX,
    PASSWORD_MIN,
    TOKEN_MAX,
    USERNAME_MAX,
    USERNAME_MIN,
)


@dataclass
class AccessTokenPayload:
    sub: UUID


class UserCreateSchema(BaseSchema):
    username: str = Field(..., min_length=USERNAME_MIN, max_length=USERNAME_MAX)
    email: str = Field(..., max_length=EMAIL_MAX)
    password_hash: str = Field(..., max_length=255)


class UserRegisterSchema(BaseSchema):
    username: str = Field(..., min_length=USERNAME_MIN, max_length=USERNAME_MAX)
    email: EmailStr = Field(..., max_length=EMAIL_MAX)
    password: str = Field(..., min_length=PASSWORD_MIN, max_length=PASSWORD_MAX)


class UserLoginSchema(BaseSchema):
    username: str = Field(..., min_length=1, max_length=USERNAME_MAX)
    password: str = Field(..., min_length=1, max_length=PASSWORD_MAX)


class RefreshTokenCreateSchema(BaseSchema):
    token_hash: str
    user_id: UUID
    expires_at: datetime


class RefreshTokenSchema(BaseSchema):
    id: UUID
    user_id: UUID
    is_revoked: bool
    expires_at: datetime
    created_at: datetime
    ip_address: str | None = None
    user_agent: str | None = None
    device_name: str | None = None


class TokenPair(BaseSchema):
    access_token: str = Field(..., max_length=JWT_MAX)
    refresh_token: str = Field(..., max_length=TOKEN_MAX)
    token_type: str = "bearer"


class RefreshTokenCreate(BaseSchema):
    user_id: UUID
    token_hash: str
    expires_at: datetime
    ip_address: str | None = None
    user_agent: str | None = None
    device_name: str | None = None


class SessionSchema(BaseSchema):
    id: UUID
    device_name: str | None = None
    ip_address: str | None = None
    created_at: datetime
    is_current: bool = False


class ForgotPasswordRequestSchema(BaseSchema):
    email: EmailStr = Field(..., max_length=EMAIL_MAX)


class ForgotPasswordResponseSchema(BaseSchema):
    message: str


class ResetPasswordRequestSchema(BaseSchema):
    token: str = Field(..., max_length=TOKEN_MAX)
    new_password: str = Field(..., min_length=PASSWORD_MIN, max_length=PASSWORD_MAX)


class VerifyEmailRequestSchema(BaseSchema):
    token: str = Field(..., max_length=TOKEN_MAX)


class ResendVerificationRequestSchema(BaseSchema):
    email: EmailStr = Field(..., max_length=EMAIL_MAX)


class MessageResponseSchema(BaseSchema):
    message: str


class ChangePasswordRequestSchema(BaseSchema):
    current_password: str = Field(..., min_length=1, max_length=PASSWORD_MAX)
    new_password: str = Field(..., min_length=PASSWORD_MIN, max_length=PASSWORD_MAX)
