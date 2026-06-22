from typing import Annotated
from fastapi import Depends

from src.module.dependencies import ModuleRepositoryDep
from src.core.dependencies import SessionDep
from src.course.dependencies import CourseRepositoryDep
from src.lesson.repository import LessonRepository
from src.lesson.service import LessonService
from src.lesson.unit_of_work import LessonUnitOfWork


def get_lesson_repository(session: SessionDep) -> LessonRepository:
    return LessonRepository(session)


LessonRepositoryDep = Annotated[LessonRepository, Depends(get_lesson_repository)]


def get_lesson_uow(
    session: SessionDep,
    lesson_repository: LessonRepositoryDep,
    course_repository: CourseRepositoryDep,
    module_repository: ModuleRepositoryDep,
) -> LessonUnitOfWork:
    return LessonUnitOfWork(
        session=session,
        lesson_repository=lesson_repository,
        course_repository=course_repository,
        module_repository=module_repository,
    )


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
