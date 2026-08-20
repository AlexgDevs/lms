from datetime import datetime
from uuid import UUID

from pydantic import Field

from src.ai.tgp.enums import TgpDecision
from src.core.schemas import BaseSchema


class TgpQuestionSchema(BaseSchema):
    id: UUID
    course_id: UUID
    module_id: UUID
    question_text: str
    options: list[str]
    correct_option: int
    created_at: datetime
    updated_at: datetime


class TgpQuestionCreateSchema(BaseSchema):
    course_id: UUID
    module_id: UUID
    question_text: str
    options: list[str]
    correct_option: int


class TgpQuestionUpdateSchema(BaseSchema):
    question_text: str | None = None
    options: list[str] | None = None
    correct_option: int | None = None
    updated_at: datetime | None = None


class TgpGenerateResponseSchema(BaseSchema):
    task_id: str
    course_id: UUID


class TgpSubmitAnswerSchema(BaseSchema):
    question_id: UUID
    answer_index: int


class TgpSubmitRequestSchema(BaseSchema):
    answers: list[TgpSubmitAnswerSchema] = Field(min_length=1)


class TgpModuleRecommendationSchema(BaseSchema):
    module_id: UUID
    module_title: str
    score: int = Field(ge=0, le=100)
    decision: TgpDecision
    reasoning: str


class TgpSubmitResponseSchema(BaseSchema):
    course_id: UUID
    modules: list[TgpModuleRecommendationSchema]
    verdict: str
