from uuid import UUID
from datetime import datetime
from typing import Any
from src.core.schemas.base_schema import BaseSchema
from src.block.enums import BlockType


class BlockSchema(BaseSchema):
    id: UUID
    lesson_id: UUID
    course_id: UUID
    title: str
    block_type: BlockType
    payload: dict[str, Any]
    created_at: datetime
    updated_at: datetime


class BlockCreateRequestSchema(BaseSchema):
    title: str
    block_type: BlockType
    payload: dict[str, Any] = {}


class BlockCreateSchema(BlockCreateRequestSchema):
    lesson_id: UUID
    course_id: UUID


class BlockUpdateRequestSchema(BaseSchema):
    title: str | None = None
    block_type: BlockType | None = None
    payload: dict[str, Any] | None = None


class BlockUpdateSchema(BlockUpdateRequestSchema):
    pass
