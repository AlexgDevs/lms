from typing import Sequence
from uuid import UUID

from sqlalchemy import select

from src.core.repositories.base_repository import BaseRepository
from src.course.category.mapper import CategoryMapper
from src.course.category.models import Category
from src.course.category.schemas import CategorySchema


class CategoryRepository(BaseRepository[Category, CategorySchema]):
    model = Category
    schema = CategorySchema
    mapper = CategoryMapper

    async def get_all_sorted(self) -> Sequence[CategorySchema]:
        query = select(self.model).order_by(self.model.sort_order)
        return await self._execute_and_map_all(query)

    async def get_by_parent_id(self, parent_id: UUID) -> Sequence[CategorySchema]:
        query = (
            select(self.model)
            .where(self.model.parent_id == parent_id)
            .order_by(self.model.sort_order)
        )
        return await self._execute_and_map_all(query)
