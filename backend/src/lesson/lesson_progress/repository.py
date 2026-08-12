from uuid import UUID

from sqlalchemy import select

from src.core.repositories.base_repository import BaseRepository
from src.lesson.lesson_progress.mapper import LessonProgressMapper
from src.lesson.lesson_progress.schemas import LessonProgressSchema
from src.lesson.models import LessonProgress


class LessonProgressRepository(BaseRepository[LessonProgress, LessonProgressSchema]):
    model = LessonProgress
    schema = LessonProgressSchema
    mapper = LessonProgressMapper

    async def get_by_user_and_lesson_ids(
        self, user_id: UUID, lesson_ids: list[UUID]
    ) -> list[LessonProgressSchema]:
        query = select(self.model).where(
            self.model.user_id == user_id,
            self.model.lesson_id.in_(lesson_ids),
        )
        result = await self.session.execute(query)
        return [self.mapper.to_schema(model) for model in result.scalars().all()]
