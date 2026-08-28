from typing import TYPE_CHECKING

import sqlalchemy as sa
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.core.postgres.base import UUIDBase
from src.core.postgres.types import str_128, created_at, uuid_pk, timestamp

if TYPE_CHECKING:
    from src.auth.models import RefreshToken


class User(UUIDBase):
    __tablename__ = "users"

    username: Mapped[str_128] = mapped_column(unique=True)
    email: Mapped[str_128] = mapped_column(unique=True)
    password_hash: Mapped[str_128]
    avatar_url: Mapped[str | None]
    joined_at: Mapped[timestamp]
    updated_at: Mapped[timestamp]
    is_active: Mapped[bool] = mapped_column(default=True)
    is_staff: Mapped[bool] = mapped_column(
        sa.Boolean(), server_default="false", default=False
    )
    ai_course_generations: Mapped[int] = mapped_column(
        sa.Integer(), server_default="0", default=0
    )

    refresh_tokens: Mapped[list["RefreshToken"]] = relationship(
        back_populates="user",
        lazy="selectin",
        cascade="all, delete-orphan",
    )
