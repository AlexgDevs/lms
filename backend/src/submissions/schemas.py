from typing import Any, ClassVar, Dict, Type
from uuid import UUID
from datetime import datetime


from src.core.schemas.mixin import PolymorphicPayloadMixin
from src.core.schemas.base_schema import BaseSchema
from src.block.enums import BlockSubmissionType, BlockType


class BlockSubmissionSchema(BaseSchema):
    id: UUID
    block_id: UUID
    user_id: UUID
    submission_type: BlockSubmissionType
    submitted_payload: dict[str, Any] | None = None
    attempts: int
    is_first_try_correct: bool | None
    created_at: datetime
    updated_at: datetime


class VoidBlockSubmission(BaseSchema):
    pass


class QuizSingleSubmission(BaseSchema):
    selected_option_id: int


class QuizMultipleSubmission(BaseSchema):
    selected_option_ids: list[int]


class CodeSubmission(BaseSchema):
    code: str


PAYLOAD_SUBMISSION_REGISTRY: Dict[BlockType, Type[BaseSchema]] = {
    BlockType.TEXT: VoidBlockSubmission,
    BlockType.CODE: CodeSubmission,
    BlockType.IMAGE: VoidBlockSubmission,
    BlockType.VIDEO: VoidBlockSubmission,
    BlockType.AUDIO: VoidBlockSubmission,
    BlockType.FILE: VoidBlockSubmission,
    BlockType.QUIZ_SINGLE_CHOICE: QuizSingleSubmission,
    BlockType.QUIZ_MULTIPLE_CHOICE: QuizMultipleSubmission,
}


class BlockSubmissionRequestCreateSchema(
    BaseSchema, PolymorphicPayloadMixin[BlockType]
):
    block_id: UUID
    block_type: BlockType
    payload: dict[str, Any]

    payload_registry: ClassVar = PAYLOAD_SUBMISSION_REGISTRY


class BlockSubmissionCreateSchema(BaseSchema):
    lesson_id: UUID
    block_id: UUID
    user_id: UUID
    submitted_payload: dict[str, Any] | None = None
    submission_type: BlockSubmissionType
    attempts: int = 1
    is_first_try_correct: bool | None = None


class BlockSubmissionUpdateSchema(BaseSchema):
    submitted_payload: dict[str, Any] | None = None
    submission_type: BlockSubmissionType | None = None
    attempts: int | None = None
    is_first_try_correct: bool | None = None
