from uuid import UUID

from sqlalchemy import func, select

from src.lesson.mapper import LessonMapper
from src.lesson.models import Lesson
from src.lesson.schemas import LessonSchema
from src.core.repositories import BaseRepository


class LessonRepository(BaseRepository[Lesson, LessonSchema]):
    model = Lesson
    schema = LessonSchema
    mapper = LessonMapper

    async def get_count(self, module_id: UUID) -> int:
        return (
            await self.session.scalar(
                select(func.count())
                .select_from(self.model)
                .where(self.model.module_id == module_id)
            )
            or 0
        )
