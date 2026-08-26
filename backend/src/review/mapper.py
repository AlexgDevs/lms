from src.core.mappers.base_mapper import BaseMapper
from src.review.models import Review
from src.review.schemas import ReviewSchema


class ReviewMapper(BaseMapper[Review, ReviewSchema]):
    orm_class = Review
    schema_class = ReviewSchema

    @classmethod
    def to_schema(cls, orm_obj: Review) -> ReviewSchema:
        return cls.schema_class.model_validate(orm_obj, from_attributes=True)
