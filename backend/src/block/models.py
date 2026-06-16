from uuid import UUID

from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import JSONB

from backend.src.postgres.base import Base
from backend.src.postgres.types import str_128, created_at, uuid_pk
from backend.src.block.enums import BlockType, BlockSubmissionType

class Block(Base):
    __tablename__ = "blocks"

    id: Mapped[uuid_pk]
    lesson_id: Mapped[UUID] = mapped_column(ForeignKey("lessons.id", ondelete="CASCADE"))
    title: Mapped[str_128]
    block_type: Mapped[BlockType]
    payload: Mapped[dict] = mapped_column(
        JSONB, 
        default=dict, 
        server_default='{}'
    )
    created_at: Mapped[created_at]


class BlockSubmission(Base):
    __tablename__ = "block_submissions"

    id: Mapped[uuid_pk]
    block_id: Mapped[UUID] = mapped_column(ForeignKey("blocks.id", ondelete="CASCADE"))
    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    submission_type: Mapped[BlockSubmissionType]
    created_at: Mapped[created_at]