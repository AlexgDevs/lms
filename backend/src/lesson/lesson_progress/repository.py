from src.core.repositories.base_repository import BaseRepository
from src.lesson.lesson_progress.mapper import LessonProgressMapper
from src.lesson.lesson_progress.schemas import LessonProgressSchema
from src.lesson.models import LessonProgress


class LessonProgressRepository(BaseRepository[LessonProgress, LessonProgressSchema]):
    model = LessonProgress
    schema = LessonProgressSchema
    mapper = LessonProgressMapper
