from uuid import UUID
from datetime import datetime

from pydantic import Field

from src.core.schemas.base_schema import BaseSchema
from src.core.schemas.limits import DESCRIPTION_MAX, TITLE_MAX, TITLE_MIN


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
    title: str = Field(..., min_length=TITLE_MIN, max_length=TITLE_MAX)
    description: str | None = Field(None, max_length=DESCRIPTION_MAX)


class LessonCreateSchema(LessonCreateRequestSchema):
    module_id: UUID
    course_id: UUID
    order: int = 0


class LessonUpdateRequestSchema(BaseSchema):
    title: str | None = Field(None, min_length=TITLE_MIN, max_length=TITLE_MAX)
    description: str | None = Field(None, max_length=DESCRIPTION_MAX)


class LessonUpdateSchema(LessonUpdateRequestSchema):
    pass


class LessonReorderSchema(BaseSchema):
    ordered_ids: list[UUID]
