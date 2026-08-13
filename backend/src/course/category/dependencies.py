from typing import Annotated

from fastapi import Depends

from src.core.dependencies import SessionDep
from src.course.category.repository import CategoryRepository
from src.course.category.service import CategoryService


def get_category_repository(session: SessionDep) -> CategoryRepository:
    return CategoryRepository(session)


CategoryRepositoryDep = Annotated[CategoryRepository, Depends(get_category_repository)]


def get_category_service(
    session: SessionDep,
    category_repository: CategoryRepositoryDep,
) -> CategoryService:
    return CategoryService(session=session, category_repository=category_repository)


CategoryServiceDep = Annotated[CategoryService, Depends(get_category_service)]
