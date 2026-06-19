from typing import TYPE_CHECKING

from uuid import UUID

from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from src.core.postgres.types import str_128, timestamp
from src.core.postgres.base import UUIDBase


class RefreshToken(UUIDBase):
    __tablename__ = "refresh_tokens"

    token_hash: Mapped[str_128]
    user_id: Mapped[UUID] = mapped_column(
        ForeignKey(
            "users.id",
            ondelete="CASCADE",
        ),
    )
    is_revoked: Mapped[bool] = mapped_column(default=False)
    expires_at: Mapped[timestamp]
    created_at: Mapped[timestamp]
