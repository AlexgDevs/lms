from enum import StrEnum
from uuid import UUID

from pydantic import Field

from src.core.schemas import BaseSchema


class AssistantFocus(StrEnum):
    CONFUSED = "confused"
    THEORY = "theory"
    CODE_ERROR = "code_error"
    STEP_BY_STEP = "steps"


class AssistantAngle(StrEnum):
    SIMPLER = "simpler"
    MORE_EXAMPLES = "more_examples"
    DIFFERENT_EXAMPLE = "different_example"
    ANOTHER_APPROACH = "another_approach"


class AssistantAction(StrEnum):
    SIMPLER_EXAMPLE = "simpler_example"
    DIAGNOSE_CODE = "diagnose_code"
    WHY_WRONG = "why_wrong"
    FIRST_STEP = "first_step"
    EXPLAIN_AGAIN = "explain_again"


class AssistantHintRequestSchema(BaseSchema):
    course_id: UUID
    lesson_id: UUID
    block_id: UUID
    focus: AssistantFocus = AssistantFocus.CONFUSED


class AssistantHintResponseSchema(BaseSchema):
    levels: list[str]


class AssistantRegenerateRequestSchema(BaseSchema):
    course_id: UUID
    lesson_id: UUID
    block_id: UUID
    level_index: int = Field(ge=0, le=4)
    angle: AssistantAngle = AssistantAngle.SIMPLER


class AssistantLevelResponseSchema(BaseSchema):
    level: str


class AssistantMessageSchema(BaseSchema):
    role: str
    content: str


class AssistantAskRequestSchema(BaseSchema):
    course_id: UUID
    lesson_id: UUID
    block_id: UUID
    question: str
    history: list[AssistantMessageSchema] = []
    revealed_levels: int = 0
    action: AssistantAction | None = None
    current_code: str | None = None
