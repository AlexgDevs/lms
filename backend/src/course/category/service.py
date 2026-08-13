from typing import Sequence

from sqlalchemy.ext.asyncio import AsyncSession

from src.core.services.base_service import BaseService
from src.course.category.repository import CategoryRepository
from src.course.category.schemas import CategorySchema


class CategoryService(BaseService):
    def __init__(
        self,
        session: AsyncSession,
        category_repository: CategoryRepository,
    ) -> None:
        super().__init__(session)
        self.category_repository = category_repository

    async def list_categories(self) -> Sequence[CategorySchema]:
        return await self.category_repository.get_all_sorted()
