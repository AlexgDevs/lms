from uuid import UUID
from datetime import datetime

from src.core.schemas.base_schema import BaseSchema


class ModuleSchema(BaseSchema):
    id: UUID
    course_id: UUID
    title: str
    description: str | None = None
    order: int = 0
    created_at: datetime
    updated_at: datetime


class ModuleCreateRequestSchema(BaseSchema):
    title: str
    description: str | None = None


class ModuleCreateSchema(ModuleCreateRequestSchema):
    course_id: UUID
    order: int = 0


class ModuleUpdateRequestSchema(BaseSchema):
    title: str | None = None
    description: str | None = None


class ModuleUpdateSchema(ModuleUpdateRequestSchema):
    pass


class ModuleReorderSchema(BaseSchema):
    ordered_ids: list[UUID]
