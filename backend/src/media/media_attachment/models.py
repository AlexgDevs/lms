from uuid import UUID

from sqlalchemy import ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from src.core.postgres.base import UUIDBase
from src.core.postgres.types import str_128, timestamp
from src.media.media_attachment.enums import MediaAttachmentRole


class MediaAttachment(UUIDBase):
    __tablename__ = "media_attachments"

    media_id: Mapped[UUID] = mapped_column(
        ForeignKey("media.id", ondelete="CASCADE"),
        index=True,
    )
    owner_type: Mapped[str_128]
    owner_id: Mapped[UUID] = mapped_column(index=True)
    role: Mapped[str_128] = mapped_column(default=MediaAttachmentRole.CONTENT)
    position: Mapped[int] = mapped_column(default=0)
    created_at: Mapped[timestamp]

    __table_args__ = (
        UniqueConstraint(
            "media_id",
            "owner_type",
            "owner_id",
            "role",
            name="uq_media_attachment",
        ),
    )
