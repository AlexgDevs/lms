from fastapi import APIRouter

from src.course.category.dependencies import CategoryServiceDep
from src.course.category.schemas import CategorySchema

router = APIRouter(prefix="/categories", tags=["Categories"])


@router.get("", response_model=list[CategorySchema])
async def list_categories(
    service: CategoryServiceDep,
) -> list[CategorySchema]:
    return list(await service.list_categories())
