from typing import List, Sequence
from uuid import UUID

from sqlalchemy import case, func, select, update


from src.block.mapper import BlockMapper
from src.block.models import Block
from src.block.schemas import BlockSchema
from src.core.repositories import BaseRepository


class BlockRepository(BaseRepository[Block, BlockSchema]):
    model = Block
    schema = BlockSchema
    mapper = BlockMapper

    async def get_count(self, lesson_id: UUID) -> int:
        return (
            await self.session.scalar(
                select(func.count())
                .select_from(self.model)
                .where(self.model.lesson_id == lesson_id)
            )
            or 0
        )

    async def set_order_bulk(self, lesson_id: UUID, ordered_ids: list[UUID]) -> None:
        ordered_expression = case(
            *[(self.model.id == id_, index) for index, id_ in enumerate(ordered_ids)],
            else_=self.model.order,
        )
        statement = (
            update(self.model)
            .where(self.model.lesson_id == lesson_id)
            .values(order=ordered_expression)
        )
        await self.session.execute(statement)

    async def get_ids_by_lesson(self, lesson_id: UUID) -> set[UUID]:
        stmt = select(self.model).where(self.model.lesson_id == lesson_id)
        result = await self.session.execute(stmt)
        return {row[0].id for row in result.fetchall()}

    async def get_by_ids(self, block_ids: list[UUID]) -> List[BlockSchema]:
        stmt = select(self.model).where(self.model.id.in_(block_ids))
        result = await self.session.execute(stmt)
        return [self.mapper.to_schema(res) for res in result.scalars().all()]
