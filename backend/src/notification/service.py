from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from src.core.services.base_service import BaseService
from src.notification.repository import NotificationRepository
from src.notification.schemas import NotificationCreateSchema, NotificationSchema


class NotificationService(BaseService):
    def __init__(
        self, session: AsyncSession, notification_repository: NotificationRepository
    ) -> None:
        super().__init__(session)
        self.notification_repository = notification_repository

    async def create(self, data: NotificationCreateSchema) -> NotificationSchema:
        notification = await self.notification_repository.create(data)
        await self.session.commit()
        return notification

    async def list_for_user(
        self, user_id: UUID, limit: int = 20, offset: int = 0
    ) -> tuple[list[NotificationSchema], int, int]:
        return await self.notification_repository.list_for_user(user_id, limit, offset)

    async def mark_read(self, notification_id: UUID, user_id: UUID) -> None:
        await self.notification_repository.mark_read(notification_id, user_id)
        await self.session.commit()

    async def mark_all_read(self, user_id: UUID) -> None:
        await self.notification_repository.mark_all_read(user_id)
        await self.session.commit()

    async def count_unread(self, user_id: UUID) -> int:
        return await self.notification_repository.count_unread(user_id)
