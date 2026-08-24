from typing import TYPE_CHECKING

from uuid import UUID

from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.core.postgres.base import UUIDBase
from src.core.postgres.types import str_128, timestamp

if TYPE_CHECKING:
    from src.user.models import User


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
    ip_address: Mapped[str | None] = mapped_column(String(45), nullable=True)
    user_agent: Mapped[str | None] = mapped_column(Text, nullable=True)
    device_name: Mapped[str | None] = mapped_column(String(128), nullable=True)

    user: Mapped["User"] = relationship(
        back_populates="refresh_tokens",
        lazy="joined",
    )
