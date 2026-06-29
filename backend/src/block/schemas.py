from uuid import UUID
from datetime import datetime
from typing import Any, ClassVar, Dict, Type

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
    created_at: datetime
    updated_at: datetime


class TextBlockContent(BaseSchema):
    text: str

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
    url: str
    alt_text: str | None = None


class VideoBlockContent(BaseSchema):
    url: str
    duration: int | None = None


class AudioBlockContent(BaseSchema):
    url: str


class FileBlockContent(BaseSchema):
    url: str
    file_name: str
    file_size: int


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


class BlockCreateRequestSchema(PolymorphicPayloadMixin[BlockType], BaseSchema):
    title: str
    block_type: BlockType
    payload: dict[str, Any]

    payload_registry: ClassVar = PAYLOAD_REGISTRY


class BlockCreateSchema(BlockCreateRequestSchema):
    lesson_id: UUID
    course_id: UUID


class BlockUpdateRequestSchema(PolymorphicPayloadMixin[BlockType], BaseSchema):
    title: str | None = None
    block_type: BlockType | None = None
    payload: dict[str, Any] | None = None

    payload_registry: ClassVar = PAYLOAD_REGISTRY

class BlockUpdateSchema(BlockUpdateRequestSchema):
    pass
