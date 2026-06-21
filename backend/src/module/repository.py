from uuid import UUID

from sqlalchemy import func, select

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
