from typing import Annotated, AsyncGenerator

from fastapi import Depends

from src.block.dependencies import BlockRepositoryDep
from src.core.dependencies import SessionDep
from src.lesson.dependencies import LessonRepositoryDep
from src.submissions.repository import BlockSubmissionRepository
from src.submissions.service import BlockSubmissionService
from src.submissions.unit_of_work import BlockSubmissionUnitOfWork


def get_submission_repository(session: SessionDep) -> BlockSubmissionRepository:
    return BlockSubmissionRepository(session)


BlockSubmissionRepositoryDep = Annotated[
    BlockSubmissionRepository, Depends(get_submission_repository)
]


async def get_submission_uow(
    session: SessionDep,
    submission_repository: BlockSubmissionRepositoryDep,
    block_repository: BlockRepositoryDep,
    lesson_repository: LessonRepositoryDep,
) -> AsyncGenerator[BlockSubmissionUnitOfWork]:
    async with BlockSubmissionUnitOfWork(
        session=session,
        block_submission_repository=submission_repository,
        block_repository=block_repository,
        lesson_repository=lesson_repository,
    ) as uow:
        yield uow


BlockSubmissionUnitOfWorkDep = Annotated[
    BlockSubmissionUnitOfWork, Depends(get_submission_uow)
]


def get_submission_service(
    session: SessionDep, block_unit_of_work: BlockSubmissionUnitOfWorkDep
) -> BlockSubmissionService:
    return BlockSubmissionService(session, block_unit_of_work)


BlockSubmissionServiceDep = Annotated[
    BlockSubmissionService, Depends(get_submission_service)
]
