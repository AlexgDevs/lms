from uuid import UUID
from datetime import datetime

from src.core.schemas.base_schema import BaseSchema


class LessonSchema(BaseSchema):
    id: UUID
    module_id: UUID
    course_id: UUID
    title: str
    description: str | None = None
    order: int = 0
    created_at: datetime
    updated_at: datetime


class LessonCreateRequestSchema(BaseSchema):
    title: str
    description: str | None = None


class LessonCreateSchema(LessonCreateRequestSchema):
    module_id: UUID
    course_id: UUID
    order: int = 0


class LessonUpdateRequestSchema(BaseSchema):
    title: str | None = None
    description: str | None = None


class LessonUpdateSchema(LessonUpdateRequestSchema):
    pass
