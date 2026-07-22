from typing import Annotated
from uuid import UUID

from fastapi import Depends, HTTPException, status

from src.auth.security import decode_token
from src.user.schemas import UserSchema
from src.user.service import UserService
from src.core.dependencies import AccessTokenDep, SessionDep
from src.user.repository import UserRepository


async def get_user_repository(session: SessionDep) -> UserRepository:
    return UserRepository(session)


UserRepositoryDep = Annotated[UserRepository, Depends(get_user_repository)]


def get_current_user_id(access_token: AccessTokenDep) -> UUID:
    user_id = decode_token(access_token).sub
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User ID not found in token",
        )
    return user_id


async def get_current_user(
    user_id: UserIdDep,
    user_service: UserServiceDep,
) -> UserSchema:
    return await user_service.get_user(user_id)


def get_user_service(
    session: SessionDep,
    user_repository: UserRepositoryDep,
) -> UserService:
    return UserService(session, user_repository)


UserServiceDep = Annotated[UserService, Depends(get_user_service)]
UserIdDep = Annotated[UUID, Depends(get_current_user_id)]
CurrentUserDep = Annotated[UserSchema, Depends(get_current_user)]
