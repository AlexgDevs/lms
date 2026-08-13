from uuid import UUID

from src.core.schemas.base_schema import BaseSchema


class CategorySchema(BaseSchema):
    id: UUID
    name: str
    slug: str
    icon: str | None
    parent_id: UUID | None
    sort_order: int
