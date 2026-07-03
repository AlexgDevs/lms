from uuid import UUID

from sqlalchemy import ForeignKey, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column

from src.core.postgres.base import UUIDBase
from src.core.postgres.types import str_128, timestamp
from src.lesson.enums import LessonProgressType


class Lesson(UUIDBase):
    __tablename__ = "lessons"

    module_id: Mapped[UUID] = mapped_column(
        ForeignKey("modules.id", ondelete="CASCADE")
    )
    title: Mapped[str_128]
    description: Mapped[str_128 | None]
    order: Mapped[int] = mapped_column(default=0)
    created_at: Mapped[timestamp]
    updated_at: Mapped[timestamp]
    course_id: Mapped[UUID] = mapped_column(ForeignKey("courses.id"))


class LessonProgress(UUIDBase):
    __tablename__ = "lesson_progress"

    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    lesson_id: Mapped[UUID] = mapped_column(
        ForeignKey("lessons.id", ondelete="CASCADE")
    )
    status: Mapped[LessonProgressType] = mapped_column(
        SAEnum(
            LessonProgressType,
            native_enum=False,
            values_callable=lambda x: [e.value for e in x],
        )
    )
    completed_at: Mapped[timestamp | None]
