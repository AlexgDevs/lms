from src.core.repositories.base_repository import BaseRepository
from src.course.mapper import CourseMapper
from src.course.models import Course
from src.course.schemas import CourseSchema


class CourseRepository(BaseRepository[Course, CourseSchema]):
    model = Course
    schema = CourseSchema
    mapper = CourseMapper
