from typing import Annotated, AsyncGenerator

from fastapi import Depends

from src.course.category.dependencies import CategoryRepositoryDep
from src.course.category.repository import CategoryRepository
from src.course.course_member.repository import CourseMemberRepository
from src.core.dependencies import SessionDep
from src.course.repository import CourseRepository
from src.course.service import CourseService
from src.course.unit_of_work import CourseUnitOfWork
from src.media.dependencies import (
    MediaAttachmentRepositoryDep,
    MediaRepositoryDep,
    MediaServiceDep,
)


def get_course_repository(session: SessionDep) -> CourseRepository:
    return CourseRepository(session)


CourseRepositoryDep = Annotated[CourseRepository, Depends(get_course_repository)]


def get_course_member_repository(session: SessionDep) -> CourseMemberRepository:
    return CourseMemberRepository(session)


CourseMemberRepositoryDep = Annotated[
    CourseMemberRepository, Depends(get_course_member_repository)
]


async def get_course_uow(
    session: SessionDep,
    course_repository: CourseRepositoryDep,
    course_member_repository: CourseMemberRepositoryDep,
    media_attachment_repository: MediaAttachmentRepositoryDep,
    media_repository: MediaRepositoryDep,
    category_repository: CategoryRepositoryDep,
) -> AsyncGenerator[CourseUnitOfWork]:
    async with CourseUnitOfWork(
        session,
        course_repository,
        course_member_repository,
        media_attachment_repository,
        media_repository,
        category_repository,
    ) as uow:
        yield uow


CourseUnitOfWorkDep = Annotated[CourseUnitOfWork, Depends(get_course_uow)]


def get_course_service(
    session: SessionDep,
    uow: CourseUnitOfWorkDep,
    media_service: MediaServiceDep,
) -> CourseService:
    return CourseService(
        session=session,
        course_unit_of_work=uow,
        media_service=media_service,
    )


CourseServiceDep = Annotated[CourseService, Depends(get_course_service)]
