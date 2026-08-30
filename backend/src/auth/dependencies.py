from typing import Annotated, AsyncGenerator

from fastapi import Depends

from src.auth.repository import RefreshTokenRepository
from src.auth.services import AuthService
from src.auth.unit_of_work import AuthUnitOfWork
from src.core.dependencies import EventBusDep, SessionDep
from src.core.rate_limit import RateLimiterDep
from src.user.dependencies import UserRepositoryDep


def get_refresh_token_repository(session: SessionDep) -> RefreshTokenRepository:
    return RefreshTokenRepository(session)


async def get_auth_unit_of_work(
    session: SessionDep,
    user_repository: UserRepositoryDep,
    refresh_token_repository: RefreshTokenRepositoryDep,
) -> AsyncGenerator[AuthUnitOfWork]:
    async with AuthUnitOfWork(
        session,
        user_repository,
        refresh_token_repository,
    ) as auth_unit_of_work:
        yield auth_unit_of_work


def get_auth_service(
    session: SessionDep,
    auth_unit_of_work: AuthUnitOfWorkDep,
    event_bus: EventBusDep,
    rate_limiter: RateLimiterDep,
) -> AuthService:
    return AuthService(
        session,
        auth_unit_of_work,
        event_bus,
        rate_limiter=rate_limiter,
    )


RefreshTokenRepositoryDep = Annotated[
    RefreshTokenRepository, Depends(get_refresh_token_repository)
]
AuthUnitOfWorkDep = Annotated[AuthUnitOfWork, Depends(get_auth_unit_of_work)]
AuthServiceDep = Annotated[AuthService, Depends(get_auth_service)]
