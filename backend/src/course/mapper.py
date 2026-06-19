from src.core.mappers.base_mapper import BaseMapper
from src.course.models import Course
from src.course.schemas import CourseSchema


class CourseMapper(BaseMapper[Course, CourseSchema]):
    orm_model = Course
    schema_class = CourseSchema
