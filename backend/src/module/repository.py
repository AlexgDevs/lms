from uuid import UUID

from sqlalchemy import case, func, select, update

from src.core.repositories import BaseRepository
from src.module.models import Module
from src.module.schemas import ModuleSchema
from src.module.mapper import ModuleMapper


class ModuleRepository(BaseRepository[Module, ModuleSchema]):
    model = Module
    schema = ModuleSchema
    mapper = ModuleMapper

    async def get_count(self, course_id: UUID) -> int:
        return (
            await self.session.scalar(
                select(func.count())
                .select_from(self.model)
                .where(self.model.course_id == course_id)
            )
            or 0
        )

    async def set_order_bulk(self, course_id: UUID, ordered_ids: list[UUID]) -> None:
        ordered_expression = case(
            *[(self.model.id == id_, index) for index, id_ in enumerate(ordered_ids)],
            else_=self.model.order,
        )
        statement = (
            update(self.model)
            .where(self.model.course_id == course_id)
            .values(order=ordered_expression)
        )
        await self.session.execute(statement)
