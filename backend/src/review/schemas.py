from datetime import datetime
from uuid import UUID

from pydantic import Field

from src.core.schemas.base_schema import BaseSchema
from src.review.enums import ReviewTargetType


class ReviewCreateRequestSchema(BaseSchema):
    target_type: ReviewTargetType
    target_id: UUID
    rating: int | None = Field(None, ge=1, le=5)
    text: str = Field(..., min_length=1, max_length=2000)
    parent_id: UUID | None = None


class ReviewCreateSchema(BaseSchema):
    user_id: UUID
    target_type: ReviewTargetType
    target_id: UUID
    rating: int | None = None
    text: str
    parent_id: UUID | None = None


class ReviewSchema(BaseSchema):
    id: UUID
    user_id: UUID
    user_username: str = ""
    user_avatar_url: str | None = None
    user_is_staff: bool = False
    user_is_founder: bool = False
    target_type: ReviewTargetType
    target_id: UUID
    rating: int | None = None
    text: str
    parent_id: UUID | None = None
    is_edited: bool = False
    created_at: datetime
    replies: list["ReviewSchema"] = []


ReviewSchema.model_rebuild()


class ReviewRatingSchema(BaseSchema):
    average: float
    count: int
    distribution: dict[str, int]
