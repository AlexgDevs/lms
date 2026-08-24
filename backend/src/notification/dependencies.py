from typing import Annotated

from fastapi import Depends

from src.core.dependencies import RedisDep, SessionDep
from src.core.websocket.manager import ConnectionManager
from src.notification.repository import NotificationRepository
from src.notification.service import NotificationService


def get_notification_repository(session: SessionDep) -> NotificationRepository:
    return NotificationRepository(session)


NotificationRepositoryDep = Annotated[
    NotificationRepository, Depends(get_notification_repository)
]


def get_notification_service(
    session: SessionDep,
    notification_repository: NotificationRepositoryDep,
) -> NotificationService:
    return NotificationService(
        session=session,
        notification_repository=notification_repository,
    )


NotificationServiceDep = Annotated[NotificationService, Depends(get_notification_service)]


def get_ws_manager(redis: RedisDep) -> ConnectionManager:
    return ConnectionManager()


_ws_manager_singleton: ConnectionManager | None = None


def get_ws_manager_singleton() -> ConnectionManager:
    global _ws_manager_singleton
    if _ws_manager_singleton is None:
        _ws_manager_singleton = ConnectionManager()
    return _ws_manager_singleton


WsManagerDep = Annotated[ConnectionManager, Depends(get_ws_manager_singleton)]
