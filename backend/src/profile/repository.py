from datetime import date
from uuid import UUID

from sqlalchemy import Date, cast, func, select

from src.core.repositories import BaseRepository
from src.lesson.lesson_progress.mapper import LessonProgressMapper
from src.lesson.lesson_progress.schemas import LessonProgressSchema
from src.lesson.models import LessonProgress


class ProfileRepository(BaseRepository[LessonProgress, LessonProgressSchema]):
    model = LessonProgress
    schema = LessonProgressSchema
    mapper = LessonProgressMapper

    async def count_completed_by_day(
        self, user_id: UUID, since: date
    ) -> dict[date, int]:
        day_col = cast(func.timezone("UTC", self.model.completed_at), Date)
        statement = (
            select(day_col, func.count())
            .where(
                self.model.user_id == user_id,
                self.model.completed_at.is_not(None),
                self.model.completed_at >= since,
            )
            .group_by(day_col)
        )
        result = await self.session.execute(statement)
        return {day: count for day, count in result.all()}

    async def get_all_completed_days(self, user_id: UUID) -> set[date]:
        day_col = cast(func.timezone("UTC", self.model.completed_at), Date)
        statement = select(day_col).where(
            self.model.user_id == user_id,
            self.model.completed_at.is_not(None),
        )
        result = await self.session.execute(statement)
        return set(result.scalars().all())
