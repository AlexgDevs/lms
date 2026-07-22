from src.core.mappers.base_mapper import BaseMapper
from src.lesson.lesson_progress.schemas import LessonProgressSchema
from src.lesson.models import LessonProgress


class LessonProgressMapper(BaseMapper[LessonProgress, LessonProgressSchema]):
    orm_model = LessonProgress
    schema_class = LessonProgressSchema
