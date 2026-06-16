from uuid import UUID

from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from backend.src.postgres.base import Base
from backend.src.postgres.types import str_128, created_at, uuid_pk


class Module(Base):
    __tablename__ = "modules"

    id: Mapped[uuid_pk]
    course_id: Mapped[UUID] = mapped_column(ForeignKey("courses.id", ondelete="CASCADE"))
    title: Mapped[str_128]
    description: Mapped[str_128 | None]
    order: Mapped[int] = mapped_column(default=0)
    created_at: Mapped[created_at]