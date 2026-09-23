from uuid import UUID
from datetime import datetime

from pydantic import Field

from src.core.schemas.base_schema import BaseSchema
from src.core.schemas.limits import DESCRIPTION_MAX, TITLE_MAX, TITLE_MIN


class ModuleSchema(BaseSchema):
    id: UUID
    course_id: UUID
    title: str
    description: str | None = None
    order: int = 0
    created_at: datetime
    updated_at: datetime


class ModuleCreateRequestSchema(BaseSchema):
    title: str = Field(..., min_length=TITLE_MIN, max_length=TITLE_MAX)
    description: str | None = Field(None, max_length=DESCRIPTION_MAX)


class ModuleCreateSchema(ModuleCreateRequestSchema):
    course_id: UUID
    order: int = 0


class ModuleUpdateRequestSchema(BaseSchema):
    title: str | None = Field(None, min_length=TITLE_MIN, max_length=TITLE_MAX)
    description: str | None = Field(None, max_length=DESCRIPTION_MAX)


class ModuleUpdateSchema(ModuleUpdateRequestSchema):
    pass


class ModuleReorderSchema(BaseSchema):
    ordered_ids: list[UUID]
