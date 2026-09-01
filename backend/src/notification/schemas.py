from datetime import datetime
from uuid import UUID

from src.core.schemas.base_schema import BaseSchema


class NotificationSchema(BaseSchema):
    id: UUID
    user_id: UUID
    type: str
    title: str
    body: str
    link: str | None
    is_read: bool
    created_at: datetime


class NotificationCreateSchema(BaseSchema):
    user_id: UUID
    type: str
    title: str
    body: str
    link: str | None = None


class NotificationListSchema(BaseSchema):
    items: list[NotificationSchema]
    total: int
    unread_count: int


class UnreadCountSchema(BaseSchema):
    count: int
