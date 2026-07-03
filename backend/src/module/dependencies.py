from typing import Annotated, AsyncGenerator

from fastapi import Depends

from src.core.dependencies import SessionDep
from src.course.dependencies import CourseRepositoryDep
from src.module.repository import ModuleRepository
from src.module.service import ModuleService
from src.module.unit_of_work import ModuleUnitOfWork


def get_module_repository(session: SessionDep) -> ModuleRepository:
    return ModuleRepository(session)


ModuleRepositoryDep = Annotated[ModuleRepository, Depends(get_module_repository)]


async def get_module_uow(
    session: SessionDep,
    module_repository: ModuleRepositoryDep,
    course_repository: CourseRepositoryDep,
) -> AsyncGenerator[ModuleUnitOfWork]:
    async with ModuleUnitOfWork(
        session=session,
        module_repository=module_repository,
        course_repository=course_repository,
    ) as uow:
        yield uow


ModuleUnitOfWorkDep = Annotated[ModuleUnitOfWork, Depends(get_module_uow)]


def get_module_service(
    session: SessionDep,
    uow: ModuleUnitOfWorkDep,
) -> ModuleService:
    return ModuleService(
        session=session,
        module_unit_of_work=uow,
    )


ModuleServiceDep = Annotated[ModuleService, Depends(get_module_service)]
