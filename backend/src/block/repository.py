from uuid import UUID

from sqlalchemy import func, select


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
