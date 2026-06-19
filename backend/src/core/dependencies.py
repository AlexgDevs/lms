from typing import Annotated, cast

from fastapi import Body, Cookie, Depends, HTTPException, Header, Request, status

from sqlalchemy.ext.asyncio import AsyncSession
from redis.asyncio import Redis

from src.core.postgres.session import get_session


async def get_redis_client(request: Request) -> Redis:
    return cast(Redis, request.app.state.redis)


def get_access_token(
    access_token_cookie: str = Cookie(
        default=None,
        include_in_schema=False,
        alias="access_token",
    ),
    access_token_header: str = Header(
        default=None,
        include_in_schema=False,
        alias="Authorization",
    ),
) -> str:
    if access_token_header:
        return access_token_header
    elif access_token_cookie:
        return access_token_cookie

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="You have not provided an access token",
    )


def get_refresh_token(
    refresh_token_cookie: str = Cookie(
        default=None,
        include_in_schema=False,
        alias="refresh_token",
    ),
    refresh_token_body: str = Body(
        default=None,
        alias="refresh_token",
        embed=True,
    ),
) -> str:
    if refresh_token_body:
        return refresh_token_body
    elif refresh_token_cookie:
        return refresh_token_cookie

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="You have not provided an refresh token",
    )


RedisDep = Annotated[Redis, Depends(get_redis_client)]
SessionDep = Annotated[AsyncSession, Depends(get_session)]
AccessTokenDep = Annotated[str, Depends(get_access_token)]
RefreshTokenDep = Annotated[str, Depends(get_refresh_token)]
