from uuid import UUID

from sqlalchemy import case, func, select, update

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

    async def set_order_bulk(
        self, module_id: UUID, course_id: UUID, ordered_ids: list[UUID]
    ) -> None:
        ordered_expression = case(
            *[(self.model.id == id_, index) for index, id_ in enumerate(ordered_ids)],
            else_=self.model.order,
        )
        statement = (
            update(self.model)
            .where(
                self.model.module_id == module_id,
                self.model.course_id == course_id,
            )
            .values(order=ordered_expression)
        )
        await self.session.execute(statement)
