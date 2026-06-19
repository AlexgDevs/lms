from uuid import UUID

from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from src.core.postgres.base import UUIDBase
from src.core.postgres.types import str_128, timestamp


class Lesson(UUIDBase):
    __tablename__ = "lessons"

    module_id: Mapped[UUID] = mapped_column(
        ForeignKey("modules.id", ondelete="CASCADE")
    )
    title: Mapped[str_128]
    description: Mapped[str_128 | None]
    order: Mapped[int] = mapped_column(default=0)
    created_at: Mapped[timestamp]
    updated_at: Mapped[timestamp]
