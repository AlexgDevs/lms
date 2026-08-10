from typing import Annotated
from uuid import UUID

from sqlalchemy import BigInteger, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from src.core.postgres.base import UUIDBase
from src.core.postgres.types import str_128, timestamp

storage_key = Annotated[str, mapped_column(String(255))]


class Media(UUIDBase):
    __tablename__ = "media"

    owner_id: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    original_name: Mapped[str_128]
    storage_key: Mapped[storage_key]
    content_type: Mapped[str_128]
    size_bytes: Mapped[int] = mapped_column(BigInteger)
    etag: Mapped[str | None] = mapped_column(nullable=True)
    is_public: Mapped[bool] = mapped_column(default=True)
    created_at: Mapped[timestamp]
    updated_at: Mapped[timestamp]
