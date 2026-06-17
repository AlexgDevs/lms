from sqlalchemy.orm import Mapped, mapped_column

from backend.src.core.postgres.base import Base
from backend.src.core.postgres.types import str_128, created_at, uuid_pk


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid_pk]
    username: Mapped[str_128] = mapped_column(unique=True)
    email: Mapped[str_128] = mapped_column(unique=True)
    password_hash: Mapped[str_128]
    avatar_url: Mapped[str_128 | None]
    created_at: Mapped[created_at]
