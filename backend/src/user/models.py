from typing import TYPE_CHECKING

from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.core.postgres.base import UUIDBase
from src.core.postgres.types import str_128, created_at, uuid_pk

if TYPE_CHECKING:
    from src.auth.models import RefreshToken


class User(UUIDBase):
    __tablename__ = "users"

    username: Mapped[str_128] = mapped_column(unique=True)
    email: Mapped[str_128] = mapped_column(unique=True)
    password_hash: Mapped[str_128]
    avatar_url: Mapped[str_128 | None]
    created_at: Mapped[created_at]

    refresh_tokens: Mapped[list["RefreshToken"]] = relationship(
        back_populates="user",
        lazy="selectin",
        cascade="all, delete-orphan",
    )
