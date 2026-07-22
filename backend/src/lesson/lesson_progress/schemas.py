from datetime import datetime
from uuid import UUID

from src.core.schemas.base_schema import BaseSchema
from src.lesson.enums import LessonProgressType


class LessonProgressSchema(BaseSchema):
    id: UUID
    user_id: UUID
    lesson_id: UUID
    status: LessonProgressType
    completed_at: datetime | None = None


class LessonProgressCreateSchema(BaseSchema):
    user_id: UUID
    lesson_id: UUID
    status: LessonProgressType
    completed_at: datetime | None = None


class LessonProgressUpdateSchema(BaseSchema):
    status: LessonProgressType | None = None
    completed_at: datetime | None = None
