from typing import Annotated, AsyncGenerator

from fastapi import Depends

from src.ai.assistant.service import AssistantService
from src.ai.assistant.unit_of_work import AssistantUnitOfWork
from src.block.dependencies import BlockRepositoryDep
from src.core.dependencies import RedisDep, SessionDep
from src.course.dependencies import CourseMemberRepositoryDep, CourseRepositoryDep
from src.lesson.dependencies import LessonRepositoryDep
from src.module.dependencies import ModuleRepositoryDep
from src.submissions.dependencies import BlockSubmissionRepositoryDep


async def get_assistant_uow(
    session: SessionDep,
    course_repository: CourseRepositoryDep,
    lesson_repository: LessonRepositoryDep,
    module_repository: ModuleRepositoryDep,
    block_repository: BlockRepositoryDep,
    submission_repository: BlockSubmissionRepositoryDep,
    course_member_repository: CourseMemberRepositoryDep,
) -> AsyncGenerator[AssistantUnitOfWork]:
    async with AssistantUnitOfWork(
        session=session,
        course_repository=course_repository,
        lesson_repository=lesson_repository,
        module_repository=module_repository,
        block_repository=block_repository,
        submission_repository=submission_repository,
        course_member_repository=course_member_repository,
    ) as uow:
        yield uow


AssistantUnitOfWorkDep = Annotated[AssistantUnitOfWork, Depends(get_assistant_uow)]


def get_assistant_service(
    session: SessionDep,
    uow: AssistantUnitOfWorkDep,
    redis: RedisDep,
) -> AssistantService:
    return AssistantService(
        session=session,
        assistant_unit_of_work=uow,
        redis=redis,
    )


AssistantServiceDep = Annotated[AssistantService, Depends(get_assistant_service)]
