from uuid import UUID
from datetime import datetime
from typing import Any, ClassVar, Dict, Self, Type

from pydantic import model_validator

from src.core.schemas.mixin import PolymorphicPayloadMixin
from src.core.schemas.base_schema import BaseSchema
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
    text: str | None = None
    html: str | None = None

    @model_validator(mode="after")
    def _ensure_content(self) -> Self:
        if self.text is None and self.html is None:
            raise ValueError("text или html должны быть заполнены")
        return self


class QuizOption(BaseSchema):
    id: int
    text: str


class QuizSingleBlockContent(BaseSchema):
    options: list[QuizOption]
    correct_option_id: int


class QuizMultipleBlockContent(BaseSchema):
    options: list[QuizOption]
    correct_option_ids: list[int]


class CodeBlockContent(BaseSchema):
    code: str
    language: str


class ImageBlockContent(BaseSchema):
    url: str | None = None
    media_id: UUID | None = None
    alt_text: str | None = None


class VideoBlockContent(BaseSchema):
    url: str | None = None
    media_id: UUID | None = None
    duration: int | None = None


class AudioBlockContent(BaseSchema):
    url: str | None = None
    media_id: UUID | None = None


class FileBlockContent(BaseSchema):
    url: str | None = None
    media_id: UUID | None = None
    file_name: str | None = None
    file_size: int | None = None


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
    title: str
    block_type: BlockType
    payload: dict[str, Any]

    payload_registry: ClassVar = PAYLOAD_REGISTRY


class BlockCreateSchema(BlockCreateRequestSchema):
    lesson_id: UUID
    course_id: UUID
    order: int = 0


class BlockUpdateRequestSchema(BaseSchema, PolymorphicPayloadMixin[BlockType]):
    title: str | None = None
    block_type: BlockType | None = None
    payload: dict[str, Any] | None = None

    payload_registry: ClassVar = PAYLOAD_REGISTRY


class BlockUpdateSchema(BlockUpdateRequestSchema):
    pass


class BlockReorderSchema(BaseSchema):
    ordered_ids: list[UUID]
