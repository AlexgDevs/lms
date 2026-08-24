from uuid import UUID

from sqlalchemy import func, select, update

from src.core.repositories.base_repository import BaseRepository
from src.notification.mapper import NotificationMapper
from src.notification.models import Notification
from src.notification.schemas import NotificationSchema


class NotificationRepository(BaseRepository[Notification, NotificationSchema]):
    model = Notification
    schema = NotificationSchema
    mapper = NotificationMapper

    async def list_for_user(
        self, user_id: UUID, limit: int, offset: int
    ) -> tuple[list[NotificationSchema], int, int]:
        count_stmt = (
            select(func.count())
            .select_from(Notification)
            .where(Notification.user_id == user_id)
        )
        total = int((await self.session.execute(count_stmt)).scalar_one())

        unread_stmt = (
            select(func.count())
            .select_from(Notification)
            .where(
                Notification.user_id == user_id,
                Notification.is_read.is_(False),
            )
        )
        unread_count = int((await self.session.execute(unread_stmt)).scalar_one())

        items_stmt = (
            select(Notification)
            .where(Notification.user_id == user_id)
            .order_by(Notification.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        result = await self.session.execute(items_stmt)
        items = [
            self.mapper.to_schema(model) for model in result.scalars().all()
        ]

        return items, total, unread_count

    async def mark_read(self, notification_id: UUID, user_id: UUID) -> None:
        stmt = (
            update(Notification)
            .where(
                Notification.id == notification_id,
                Notification.user_id == user_id,
            )
            .values(is_read=True)
        )
        await self.session.execute(stmt)

    async def mark_all_read(self, user_id: UUID) -> None:
        stmt = (
            update(Notification)
            .where(
                Notification.user_id == user_id,
                Notification.is_read.is_(False),
            )
            .values(is_read=True)
        )
        await self.session.execute(stmt)

    async def count_unread(self, user_id: UUID) -> int:
        stmt = (
            select(func.count())
            .select_from(Notification)
            .where(
                Notification.user_id == user_id,
                Notification.is_read.is_(False),
            )
        )
        return int((await self.session.execute(stmt)).scalar_one())
