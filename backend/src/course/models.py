from sqlalchemy.orm import Mapped, mapped_column

from src.core.postgres.base import UUIDBase
from src.core.postgres.types import str_128, created_at


class Course(UUIDBase):
    __tablename__ = "courses"

    title: Mapped[str_128]
    description: Mapped[str_128 | None]
    cover_url: Mapped[str]
    price: Mapped[int] = mapped_column(default=0)
    created_at: Mapped[created_at]
