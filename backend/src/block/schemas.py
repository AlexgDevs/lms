from uuid import UUID
from datetime import datetime
from typing import Any, ClassVar, Dict, Self, Type

from pydantic import Field, model_validator

from src.core.schemas.mixin import PolymorphicPayloadMixin
from src.core.schemas.base_schema import BaseSchema
from src.core.schemas.limits import (
    ALT_TEXT_MAX,
    CODE_MAX,
    IMAGE_NAME_MAX,
    LANGUAGE_MAX,
    QUIZ_OPTIONS_MAX,
    QUIZ_OPTIONS_MIN,
    QUIZ_OPTION_MAX,
    RICH_TEXT_MAX,
    TEST_CASES_MAX,
    TITLE_MAX,
    TITLE_MIN,
    URL_MAX,
)
from src.block.enums import BlockType


class BlockSchema(BaseSchema):
    id: UUID
    lesson_id: UUID
    course_id: UUID
    title: str
    block_type: BlockType
    payload: dict[str, Any]
    order: int = 0
    created_at: datetime
    updated_at: datetime


class TextBlockContent(BaseSchema):
    text: str | None = Field(None, max_length=RICH_TEXT_MAX)
    html: str | None = Field(None, max_length=RICH_TEXT_MAX)

    @model_validator(mode="after")
    def _ensure_content(self) -> Self:
        if self.text is None and self.html is None:
            raise ValueError("text или html должны быть заполнены")
        return self


class QuizOption(BaseSchema):
    id: int
    text: str = Field(..., max_length=QUIZ_OPTION_MAX)


class QuizSingleBlockContent(BaseSchema):
    options: list[QuizOption] = Field(
        ..., min_length=QUIZ_OPTIONS_MIN, max_length=QUIZ_OPTIONS_MAX
    )
    correct_option_id: int


class QuizMultipleBlockContent(BaseSchema):
    options: list[QuizOption] = Field(
        ..., min_length=QUIZ_OPTIONS_MIN, max_length=QUIZ_OPTIONS_MAX
    )
    correct_option_ids: list[int] = Field(..., min_length=1)

    @model_validator(mode="after")
    def _ensure_correct_ids(self) -> Self:
        valid_ids = {option.id for option in self.options}
        if not set(self.correct_option_ids) <= valid_ids:
            raise ValueError(
                "correct_option_ids должны ссылаться на существующие варианты"
            )
        return self


class CodeTestCase(BaseSchema):
    input: str = Field("", max_length=CODE_MAX)
    output: str = Field("", max_length=CODE_MAX)


class CodeBlockContent(BaseSchema):
    code: str = Field(..., max_length=CODE_MAX)
    language: str = Field(..., min_length=1, max_length=LANGUAGE_MAX)
    test_cases: list[CodeTestCase] = Field(
        default_factory=list, max_length=TEST_CASES_MAX
    )


class ImageBlockContent(BaseSchema):
    url: str | None = Field(None, max_length=URL_MAX)
    media_id: UUID | None = None
    alt_text: str | None = Field(None, max_length=ALT_TEXT_MAX)


class VideoBlockContent(BaseSchema):
    url: str | None = Field(None, max_length=URL_MAX)
    media_id: UUID | None = None
    duration: int | None = Field(None, ge=0)


class AudioBlockContent(BaseSchema):
    url: str | None = Field(None, max_length=URL_MAX)
    media_id: UUID | None = None


class FileBlockContent(BaseSchema):
    url: str | None = Field(None, max_length=URL_MAX)
    media_id: UUID | None = None
    file_name: str | None = Field(None, max_length=IMAGE_NAME_MAX)
    file_size: int | None = Field(None, ge=0)


PAYLOAD_REGISTRY: Dict[BlockType, Type[BaseSchema]] = {
    BlockType.TEXT: TextBlockContent,
    BlockType.QUIZ_SINGLE_CHOICE: QuizSingleBlockContent,
    BlockType.QUIZ_MULTIPLE_CHOICE: QuizMultipleBlockContent,
    BlockType.CODE: CodeBlockContent,
    BlockType.IMAGE: ImageBlockContent,
    BlockType.VIDEO: VideoBlockContent,
    BlockType.AUDIO: AudioBlockContent,
    BlockType.FILE: FileBlockContent,
}


class BlockCreateRequestSchema(BaseSchema, PolymorphicPayloadMixin[BlockType]):
    title: str = Field(..., min_length=TITLE_MIN, max_length=TITLE_MAX)
    block_type: BlockType
    payload: dict[str, Any]

    payload_registry: ClassVar = PAYLOAD_REGISTRY


class BlockCreateSchema(BlockCreateRequestSchema):
    lesson_id: UUID
    course_id: UUID
    order: int = 0


class BlockUpdateRequestSchema(BaseSchema, PolymorphicPayloadMixin[BlockType]):
    title: str | None = Field(default=None, min_length=TITLE_MIN, max_length=TITLE_MAX)
    block_type: BlockType | None = None
    payload: dict[str, Any] | None = None

    payload_registry: ClassVar = PAYLOAD_REGISTRY


class BlockUpdateSchema(BlockUpdateRequestSchema):
    pass


class BlockReorderSchema(BaseSchema):
    ordered_ids: list[UUID]
