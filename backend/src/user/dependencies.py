from uuid import UUID
from typing import Annotated

from fastapi import Depends, Request

from src.auth.exceptions import InvalidAccessTokenError
from src.core.dependencies import (
    AccessTokenDep,
    SessionDep,
)
from src.auth.security import decode_access_token
from src.user.repository import UserRepository
from src.user.schemas import UserSchema
from src.user.service import UserService


def get_user_repository(session: SessionDep) -> UserRepository:
    return UserRepository(session)


def get_user_service(
    session: SessionDep, user_repository: UserRepositoryDep
) -> UserService:
    return UserService(session, user_repository)


def get_current_user_id(access_token: AccessTokenDep) -> UUID:
    user_id = decode_access_token(access_token).get("sub")
    if not user_id:
        raise InvalidAccessTokenError
    return UUID(user_id)


def get_optional_current_user_id(request: Request) -> UUID | None:
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return None
    access_token = auth_header.removeprefix("Bearer ").strip()
    if not access_token:
        return None
    try:
        user_id = decode_access_token(access_token).get("sub")
    except InvalidAccessTokenError:
        return None
    if not user_id:
        return None
    return UUID(user_id)


async def get_current_user(
    user_id: UserIdDep,
    user_service: UserServiceDep,
) -> UserSchema:
    return await user_service.get_user(user_id)


UserRepositoryDep = Annotated[UserRepository, Depends(get_user_repository)]
UserServiceDep = Annotated[UserService, Depends(get_user_service)]
UserIdDep = Annotated[UUID, Depends(get_current_user_id)]
OptionalUserIdDep = Annotated[UUID | None, Depends(get_optional_current_user_id)]
CurrentUserDep = Annotated[UserSchema, Depends(get_current_user)]
