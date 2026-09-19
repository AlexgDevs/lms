from typing import Annotated, cast

from fastapi import Depends
from fastapi.requests import Request
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from redis.asyncio import Redis

from src.core.config import settings
from src.core.events.protocol import Event
from src.core.postgres.session import get_session
from src.core.storage import Storage
from src.core.websocket.manager import ConnectionManager

reusable_oauth2 = OAuth2PasswordBearer(
    tokenUrl=f"{settings.app.API_V1_STR}/auth/login",
)


def get_redis(request: Request) -> Redis:
    return cast(Redis, request.app.state.redis)


def get_storage(request: Request) -> Storage:
    return cast(Storage, request.app.state.storage)


def get_event_bus(request: Request) -> Event:
    return cast(Event, request.app.state.event_bus)


def get_ws_manager(request: Request) -> ConnectionManager:
    return cast(ConnectionManager, request.app.state.ws_manager)


SessionDep = Annotated[AsyncSession, Depends(get_session)]
RedisDep = Annotated[Redis, Depends(get_redis)]
StorageDep = Annotated[Storage, Depends(get_storage)]
AccessTokenDep = Annotated[str, Depends(reusable_oauth2)]
EventBusDep = Annotated[Event, Depends(get_event_bus)]
WsManagerDep = Annotated[ConnectionManager, Depends(get_ws_manager)]
