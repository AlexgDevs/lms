from typing import Annotated, AsyncGenerator

from fastapi import Depends

from src.ai.tgp.repository import TgpQuestionRepository
from src.ai.tgp.service import AiService
from src.ai.tgp.unit_of_work import AiUnitOfWork
from src.core.dependencies import RedisDep, SessionDep
from src.course.course_member.repository import CourseMemberRepository
from src.course.dependencies import CourseRepositoryDep
from src.module.dependencies import ModuleRepositoryDep


def get_ai_question_repository(session: SessionDep) -> TgpQuestionRepository:
    return TgpQuestionRepository(session)


AiQuestionRepositoryDep = Annotated[
    TgpQuestionRepository, Depends(get_ai_question_repository)
]


def get_ai_course_member_repository(session: SessionDep) -> CourseMemberRepository:
    return CourseMemberRepository(session)


AiCourseMemberRepositoryDep = Annotated[
    CourseMemberRepository, Depends(get_ai_course_member_repository)
]


async def get_ai_uow(
    session: SessionDep,
    question_repository: AiQuestionRepositoryDep,
    course_repository: CourseRepositoryDep,
    module_repository: ModuleRepositoryDep,
    course_member_repository: AiCourseMemberRepositoryDep,
) -> AsyncGenerator[AiUnitOfWork]:
    async with AiUnitOfWork(
        session,
        question_repository,
        course_repository,
        module_repository,
        course_member_repository,
    ) as uow:
        yield uow


AiUnitOfWorkDep = Annotated[AiUnitOfWork, Depends(get_ai_uow)]


def get_ai_service(
    session: SessionDep,
    uow: AiUnitOfWorkDep,
    redis: RedisDep,
) -> AiService:
    return AiService(
        session=session,
        ai_unit_of_work=uow,
        redis=redis,
    )


AiServiceDep = Annotated[AiService, Depends(get_ai_service)]
