from typing import Annotated, AsyncGenerator
from fastapi import Depends

from src.lesson.lesson_progress.dependencies import LessonProgressRepositoryDep
from src.module.dependencies import ModuleRepositoryDep
from src.core.dependencies import SessionDep
from src.course.dependencies import CourseRepositoryDep

from src.lesson.repository import LessonRepository
from src.lesson.service import LessonService
from src.lesson.unit_of_work import LessonUnitOfWork


def get_lesson_repository(session: SessionDep) -> LessonRepository:
    return LessonRepository(session)


LessonRepositoryDep = Annotated[LessonRepository, Depends(get_lesson_repository)]


async def get_lesson_uow(
    session: SessionDep,
    lesson_repository: LessonRepositoryDep,
    lesson_progress_repository: LessonProgressRepositoryDep,
    course_repository: CourseRepositoryDep,
    module_repository: ModuleRepositoryDep,
) -> AsyncGenerator[LessonUnitOfWork]:
    async with LessonUnitOfWork(
        session=session,
        lesson_repository=lesson_repository,
        lesson_progress_repository=lesson_progress_repository,
        course_repository=course_repository,
        module_repository=module_repository,
    ) as uow:
        yield uow


LessonUnitOfWorkDep = Annotated[LessonUnitOfWork, Depends(get_lesson_uow)]


def get_lesson_service(
    session: SessionDep,
    uow: LessonUnitOfWorkDep,
) -> LessonService:
    return LessonService(
        session=session,
        lesson_unit_of_work=uow,
    )


LessonServiceDep = Annotated[LessonService, Depends(get_lesson_service)]
