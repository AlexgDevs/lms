from uuid import UUID

from sqlalchemy import ForeignKey, Uuid
from sqlalchemy.orm import Mapped, mapped_column

from src.core.postgres.base import UUIDBase
from src.core.postgres.types import str_128


class Category(UUIDBase):
    __tablename__ = "categories"

    name: Mapped[str_128]
    slug: Mapped[str_128] = mapped_column(unique=True, index=True)
    icon: Mapped[str | None]
    parent_id: Mapped[UUID | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("categories.id", ondelete="CASCADE"),
        index=True,
    )
    sort_order: Mapped[int] = mapped_column(default=0)
