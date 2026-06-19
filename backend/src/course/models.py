from datetime import datetime
from uuid import UUID

from sqlalchemy import DateTime, ForeignKey, UUID as sqlUUID
from sqlalchemy.orm import Mapped, mapped_column

from src.core.postgres.base import UUIDBase
from src.core.postgres.types import str_128, timestamp


class Course(UUIDBase):
    __tablename__ = "courses"

    title: Mapped[str_128]
    owner_id: Mapped[UUID] = mapped_column(
        sqlUUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
    )
    description: Mapped[str_128 | None]
    cover_url: Mapped[str | None]
    price: Mapped[int] = mapped_column(default=0)

    # times
    created_at: Mapped[timestamp]
    updated_at: Mapped[timestamp]
    is_deleted: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
