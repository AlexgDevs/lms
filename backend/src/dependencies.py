from typing import Annotated, cast

from fastapi import Depends, Request

from sqlalchemy.ext.asyncio import AsyncSession
from redis.asyncio import Redis

from src.core.postgres.session import get_session


async def get_redis_client(request: Request) -> Redis:
    return cast(Redis, request.app.state.redis)


RedisDep = Annotated[Redis, Depends(get_redis_client)]
SessionDep = Annotated[AsyncSession, Depends(get_session)]
