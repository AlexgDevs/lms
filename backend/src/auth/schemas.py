from dataclasses import dataclass
from datetime import datetime
from uuid import UUID

from pydantic import EmailStr

from src.core.schemas import BaseSchema


@dataclass
class AccessTokenPayload:
    sub: UUID


class UserCreateSchema(BaseSchema):
    username: str
    email: str
    password_hash: str


class UserRegisterSchema(BaseSchema):
    username: str
    email: EmailStr
    password: str


class UserLoginSchema(BaseSchema):
    username: str
    password: str


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


class TokenPair(BaseSchema):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshTokenCreate(BaseSchema):
    user_id: UUID
    token_hash: str
    expires_at: datetime


class ForgotPasswordRequestSchema(BaseSchema):
    email: EmailStr


class ForgotPasswordResponseSchema(BaseSchema):
    message: str
    reset_token: str | None = None


class ResetPasswordRequestSchema(BaseSchema):
    token: str
    new_password: str


class ChangePasswordRequestSchema(BaseSchema):
    current_password: str
    new_password: str
