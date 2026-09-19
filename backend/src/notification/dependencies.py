from typing import Annotated

from fastapi import Depends

from src.core.dependencies import SessionDep
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


NotificationServiceDep = Annotated[
    NotificationService, Depends(get_notification_service)
]
