from typing import Any, Dict
from uuid import UUID

from sqlalchemy import ForeignKey, Enum as SAEnum, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import JSONB

from src.core.postgres.base import UUIDBase
from src.core.postgres.types import str_128, timestamp
from src.block.enums import BlockType, BlockSubmissionType


class Block(UUIDBase):
    __tablename__ = "blocks"

    lesson_id: Mapped[UUID] = mapped_column(
        ForeignKey("lessons.id", ondelete="CASCADE")
    )
    title: Mapped[str_128]
    block_type: Mapped[BlockType] = mapped_column(
        SAEnum(
            BlockType, native_enum=False, values_callable=lambda x: [e.value for e in x]
        )
    )
    payload: Mapped[Dict[str, Any]] = mapped_column(
        JSONB, default=dict, server_default="{}"
    )
    created_at: Mapped[timestamp]
    updated_at: Mapped[timestamp]
    course_id: Mapped[UUID] = mapped_column(ForeignKey("courses.id"))


class BlockSubmission(UUIDBase):
    __tablename__ = "block_submissions"

    lesson_id: Mapped[UUID] = mapped_column(
        ForeignKey("lessons.id", ondelete="CASCADE")
    )
    block_id: Mapped[UUID] = mapped_column(ForeignKey("blocks.id", ondelete="CASCADE"))
    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))

    submission_type: Mapped[BlockSubmissionType] = mapped_column(
        SAEnum(
            BlockSubmissionType,
            native_enum=False,
            values_callable=lambda x: [e.value for e in x],
        )
    )

    submitted_payload: Mapped[dict[str, Any] | None] = mapped_column(
        JSONB, nullable=True
    )
    attempts: Mapped[int] = mapped_column(default=0)
    is_first_try_correct: Mapped[bool | None] = mapped_column(nullable=True)

    created_at: Mapped[timestamp]
    updated_at: Mapped[timestamp]

    __table_args__ = (
        UniqueConstraint("user_id", "block_id", name="uq_user_block_submission"),
    )
