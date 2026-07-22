from typing import Any

from sqlalchemy import Row

from src.core.mappers.base_mapper import BaseMapper
from src.course.models import Course
from src.course.schemas import CourseSchema, CourseUserBriefSchema


class CourseMapper(BaseMapper[Course, CourseSchema]):
    orm_model = Course
    schema_class = CourseSchema


class CourseUserBriefMapper(BaseMapper[Course, CourseUserBriefSchema]):
    orm_model = Course
    schema_class = CourseUserBriefSchema

    @classmethod
    def to_schema(cls, row: Row[Any] | Course) -> CourseUserBriefSchema:
        return cls.schema_class.model_validate(row)
