from uuid import UUID

from pydantic import Field

from src.ai.assistant.enums import AssistantAction, AssistantAngle, AssistantFocus
from src.core.schemas import BaseSchema


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
