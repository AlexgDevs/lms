from src.core.mappers.base_mapper import BaseMapper
from src.review.models import Review
from src.review.schemas import ReviewSchema
from src.user.schemas import UserSchema


class ReviewMapper(BaseMapper[Review, ReviewSchema]):
    orm_class = Review
    schema_class = ReviewSchema

    @classmethod
    def to_schema(cls, orm_obj: Review) -> ReviewSchema:
        return cls.schema_class.model_validate(orm_obj, from_attributes=True)

    @classmethod
    def enrich_with_user(cls, review: ReviewSchema, user: UserSchema) -> ReviewSchema:
        """Return a new ReviewSchema enriched with user display fields via Pydantic schema."""
        return review.model_copy(
            update={
                "user_username": user.username,
                "user_avatar_url": user.avatar_url,
                "user_is_staff": user.is_staff,
                "user_is_founder": user.is_founder,
            }
        )
