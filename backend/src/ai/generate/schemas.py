from typing import Any

from pydantic import Field

from src.block.enums import BlockType
from src.core.schemas.base_schema import BaseSchema


class ModulePlanSchema(BaseSchema):
    title: str = Field(..., max_length=120)
    description: str = Field(default="", max_length=300)


class ModulesResponseSchema(BaseSchema):
    modules: list[ModulePlanSchema]


class LessonPlanSchema(BaseSchema):
    title: str = Field(..., max_length=120)
    description: str = Field(default="", max_length=300)


class LessonsResponseSchema(BaseSchema):
    lessons: list[LessonPlanSchema]


class LessonBlockPlanSchema(BaseSchema):
    type: BlockType
    purpose: str = Field(..., max_length=500)


_LESSON_TYPES_PATTERN = (
    r"^(theory|practice|assessment|theory_with_practice|case_study|project)$"
)


class LessonPlanResponseSchema(BaseSchema):
    lesson_type: str = Field(..., pattern=_LESSON_TYPES_PATTERN)
    blocks: list[LessonBlockPlanSchema] = Field(..., min_length=1)


class BatchLessonPlanItemSchema(BaseSchema):
    lesson_title: str
    lesson_type: str = Field(..., pattern=_LESSON_TYPES_PATTERN)
    blocks: list[LessonBlockPlanSchema] = Field(..., min_length=1)


class BatchLessonPlansResponseSchema(BaseSchema):
    plans: list[BatchLessonPlanItemSchema]


class BlockContentSchema(BaseSchema):
    block_index: int
    title: str = Field(..., max_length=120)
    payload: dict[str, Any]


class BatchBlocksResponseSchema(BaseSchema):
    blocks: list[BlockContentSchema]
