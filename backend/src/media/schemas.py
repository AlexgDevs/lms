from datetime import datetime
from uuid import UUID

from src.core.schemas.base_schema import BaseSchema


class MediaSchema(BaseSchema):
    id: UUID
    owner_id: UUID
    original_name: str
    storage_key: str
    content_type: str
    size_bytes: int
    etag: str | None = None
    is_public: bool = True
    created_at: datetime
    updated_at: datetime


class MediaCreateSchema(BaseSchema):
    id: UUID
    owner_id: UUID
    original_name: str
    storage_key: str
    content_type: str
    size_bytes: int
    etag: str | None = None
    is_public: bool = True


class MediaUrlResponseSchema(BaseSchema):
    url: str | None = None
