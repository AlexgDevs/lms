from typing import Annotated

from fastapi import Depends

from src.core.dependencies import SessionDep
from src.course.repository import CourseRepository
from src.course.service import CourseService
from src.course.unit_of_work import CourseUnitOfWork


def get_course_repository(session: SessionDep) -> CourseRepository:
    return CourseRepository(session)


CourseRepositoryDep = Annotated[CourseRepository, Depends(get_course_repository)]


def get_course_uow(
    session: SessionDep,
    course_repository: CourseRepositoryDep,
) -> CourseUnitOfWork:
    return CourseUnitOfWork(session, course_repository)


CourseUnitOfWorkDep = Annotated[CourseUnitOfWork, Depends(get_course_uow)]


def get_course_service(
    session: SessionDep,
    uow: CourseUnitOfWorkDep,
) -> CourseService:
    return CourseService(
        session=session,
        course_unit_of_work=uow,
    )


CourseServiceDep = Annotated[CourseService, Depends(get_course_service)]
