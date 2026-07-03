from typing import Annotated, AsyncGenerator
from fastapi import Depends

from src.auth.services import AuthService
from src.user.dependencies import UserRepositoryDep
from src.core.dependencies import RedisDep, SessionDep
from src.auth.unit_of_work import AuthUnitOfWork
from src.auth.repository import AuthRepository


async def get_auth_repository(session: SessionDep) -> AuthRepository:
    return AuthRepository(session)


async def get_auth_unit_of_work(
    session: SessionDep,
    user_repository: UserRepositoryDep,
    auth_repository: AuthRepositoryDep,
) -> AsyncGenerator[AuthUnitOfWork]:
    async with AuthUnitOfWork(
        session,
        user_repository,
        auth_repository,
    ) as uow:
        yield uow


async def get_auth_service(
    session: SessionDep,
    auth_unit_of_work: AuthUnitOfWorkDep,
    redis_client: RedisDep,
) -> AuthService:
    return AuthService(
        session,
        auth_unit_of_work,
        redis_client,
    )


AuthRepositoryDep = Annotated[AuthRepository, Depends(get_auth_repository)]
AuthUnitOfWorkDep = Annotated[AuthUnitOfWork, Depends(get_auth_unit_of_work)]
AuthServiceDep = Annotated[AuthService, Depends(get_auth_service)]
