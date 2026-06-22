from src.lesson.schemas import LessonSchema
from src.core.mappers import BaseMapper
from src.lesson.models import Lesson


class LessonMapper(BaseMapper[Lesson, LessonSchema]):
    orm_model = Lesson
    schema_class = LessonSchema
