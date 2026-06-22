from typing import Any, Dict
from uuid import UUID

from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import JSONB

from src.core.postgres.base import UUIDBase
from src.core.postgres.types import str_128, created_at, uuid_pk, timestamp
from src.block.enums import BlockType, BlockSubmissionType


class Block(UUIDBase):
    __tablename__ = "blocks"

    lesson_id: Mapped[UUID] = mapped_column(
        ForeignKey("lessons.id", ondelete="CASCADE")
    )
    title: Mapped[str_128]
    block_type: Mapped[BlockType]
    payload: Mapped[Dict[str, Any]] = mapped_column(
        JSONB, default=dict, server_default="{}"
    )
    created_at: Mapped[timestamp]
    updated_at: Mapped[timestamp]
    course_id: Mapped[UUID] = mapped_column(
        ForeignKey("courses.id")
    )

class BlockSubmission(UUIDBase):
    __tablename__ = "block_submissions"

    block_id: Mapped[UUID] = mapped_column(ForeignKey("blocks.id", ondelete="CASCADE"))
    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    submission_type: Mapped[BlockSubmissionType]
    created_at: Mapped[timestamp]
    updated_at: Mapped[timestamp]
