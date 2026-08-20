from uuid import UUID

from sqlalchemy import ForeignKey, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from src.core.postgres.base import UUIDBase
from src.core.postgres.types import timestamp


class TgpQuestion(UUIDBase):
    __tablename__ = "tgp_questions"

    course_id: Mapped[UUID] = mapped_column(
        ForeignKey("courses.id", ondelete="CASCADE"), index=True
    )
    module_id: Mapped[UUID] = mapped_column(
        ForeignKey("modules.id", ondelete="CASCADE")
    )
    question_text: Mapped[str] = mapped_column(Text)
    options: Mapped[list[str]] = mapped_column(JSONB, default=list, server_default="[]")
    correct_option: Mapped[int] = mapped_column(default=0)
    created_at: Mapped[timestamp]
    updated_at: Mapped[timestamp]
