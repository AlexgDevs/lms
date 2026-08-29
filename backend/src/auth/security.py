import secrets
from typing import Any
from uuid import UUID

import jwt
import hashlib
from datetime import datetime, timedelta, timezone

from pwdlib import PasswordHash
from pwdlib.hashers.argon2 import Argon2Hasher

from src.auth.exceptions import InvalidAccessTokenError
from src.core.config import settings

password_hasher = PasswordHash((Argon2Hasher(),))


def hash_password(password: str) -> str:
    return password_hasher.hash(password)


def verify_password(
    plain_password: str,
    hashed_password: str,
) -> bool:
    return password_hasher.verify(plain_password, hashed_password)


def create_access_token(subject: UUID | Any) -> str:
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.app.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    access_token = jwt.encode(
        payload={
            "sub": str(subject),
            "exp": expire,
        },
        key=settings.app.JWT_SECRET_KEY,
        algorithm=settings.app.JWT_ALGORITHM,
    )
    return access_token


def decode_access_token(access_token: str) -> dict[str, Any]:
    try:
        payload = jwt.decode(
            jwt=access_token,
            key=settings.app.JWT_SECRET_KEY,
            algorithms=[settings.app.JWT_ALGORITHM],
        )
    except jwt.InvalidTokenError as e:
        raise InvalidAccessTokenError from e
    return payload


def create_refresh_token() -> tuple[str, str]:
    token = secrets.token_urlsafe(48)
    token_hash = hash_refresh_token(token)
    return token, token_hash


def hash_refresh_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def create_reset_token(user_id: UUID) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    return jwt.encode(
        payload={"sub": str(user_id), "exp": expire, "type": "reset"},
        key=settings.app.JWT_SECRET_KEY,
        algorithm=settings.app.JWT_ALGORITHM,
    )


def decode_reset_token(token: str) -> UUID:
    try:
        payload = jwt.decode(
            jwt=token,
            key=settings.app.JWT_SECRET_KEY,
            algorithms=[settings.app.JWT_ALGORITHM],
        )
        if payload.get("type") != "reset":
            raise InvalidAccessTokenError
        return UUID(payload["sub"])
    except jwt.InvalidTokenError as e:
        raise InvalidAccessTokenError from e


def create_verification_token(user_id: UUID) -> str:
    expire = datetime.now(timezone.utc) + timedelta(hours=24)
    return jwt.encode(
        payload={"sub": str(user_id), "exp": expire, "type": "verify"},
        key=settings.app.JWT_SECRET_KEY,
        algorithm=settings.app.JWT_ALGORITHM,
    )


def decode_verification_token(token: str) -> UUID:
    try:
        payload = jwt.decode(
            jwt=token,
            key=settings.app.JWT_SECRET_KEY,
            algorithms=[settings.app.JWT_ALGORITHM],
        )
        if payload.get("type") != "verify":
            raise InvalidAccessTokenError
        return UUID(payload["sub"])
    except jwt.InvalidTokenError as e:
        raise InvalidAccessTokenError from e
