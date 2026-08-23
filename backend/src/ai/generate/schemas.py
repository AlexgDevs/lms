from typing import Any

from pydantic import Field

from src.block.enums import BlockType
from src.core.schemas.base_schema import BaseSchema


class ModulePlanSchema(BaseSchema):
    title: str = Field(..., max_length=150)
    description: str = Field(default="", max_length=500)


class ModulesResponseSchema(BaseSchema):
    modules: list[ModulePlanSchema]


class LessonPlanSchema(BaseSchema):
    title: str = Field(..., max_length=150)
    description: str = Field(default="", max_length=500)


class LessonsResponseSchema(BaseSchema):
    lessons: list[LessonPlanSchema]


class LessonBlockPlanSchema(BaseSchema):
    type: BlockType
    purpose: str = Field(..., max_length=500)


class LessonPlanResponseSchema(BaseSchema):
    lesson_type: str = Field(
        ...,
        pattern="^(theory|practice|assessment|theory_with_practice)$",
    )
    blocks: list[LessonBlockPlanSchema] = Field(..., min_length=1)


class BatchLessonPlanItemSchema(BaseSchema):
    lesson_title: str
    lesson_type: str = Field(
        ...,
        pattern="^(theory|practice|assessment|theory_with_practice)$",
    )
    blocks: list[LessonBlockPlanSchema] = Field(..., min_length=1)


class BatchLessonPlansResponseSchema(BaseSchema):
    plans: list[BatchLessonPlanItemSchema]


class BlockContentSchema(BaseSchema):
    block_index: int
    title: str = Field(..., max_length=150)
    payload: dict[str, Any]


class BatchBlocksResponseSchema(BaseSchema):
    blocks: list[BlockContentSchema]
