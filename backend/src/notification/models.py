import uuid

import sqlalchemy as sa
from sqlalchemy.orm import Mapped, mapped_column

from src.core.postgres.base import UUIDBase
from src.core.postgres.types import str_128, timestamp


class Notification(UUIDBase):
    __tablename__ = "notifications"

    user_id: Mapped[uuid.UUID] = mapped_column(
        sa.ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    type: Mapped[str_128] = mapped_column(index=True)
    title: Mapped[str_128]
    body: Mapped[str]
    link: Mapped[str | None]
    is_read: Mapped[bool] = mapped_column(
        sa.Boolean(), server_default="false", default=False
    )
    created_at: Mapped[timestamp]
