from sqlalchemy.orm import Mapped, mapped_column

from src.core.postgres.base import Base
from src.core.postgres.types import str_128, created_at, uuid_pk


class Course(Base):
    __tablename__ = "courses"

    id: Mapped[uuid_pk]
    title: Mapped[str_128]
    description: Mapped[str_128 | None]
    cover_url: Mapped[str]
    price: Mapped[int] = mapped_column(default=0)
    created_at: Mapped[created_at]
