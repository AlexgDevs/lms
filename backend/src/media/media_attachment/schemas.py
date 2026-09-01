from datetime import datetime
from uuid import UUID

from src.core.schemas.base_schema import BaseSchema


class MediaAttachmentSchema(BaseSchema):
    id: UUID
    media_id: UUID
    owner_type: str
    owner_id: UUID
    role: str
    position: int = 0
    created_at: datetime


class MediaAttachmentCreateSchema(BaseSchema):
    media_id: UUID
    owner_type: str
    owner_id: UUID
    role: str = "content"
    position: int = 0
