from typing import Annotated, AsyncGenerator
from fastapi import Depends

from src.core.dependencies import SessionDep, StorageDep
from src.course.dependencies import CourseRepositoryDep
from src.lesson.dependencies import LessonRepositoryDep
from src.block.repository import BlockRepository
from src.block.service import BlockService
from src.block.unit_of_work import BlockUnitOfWork
from src.media.dependencies import (
    MediaAttachmentRepositoryDep,
    MediaRepositoryDep,
    MediaServiceDep,
)


def get_block_repository(session: SessionDep) -> BlockRepository:
    return BlockRepository(session)


BlockRepositoryDep = Annotated[BlockRepository, Depends(get_block_repository)]


async def get_block_uow(
    session: SessionDep,
    block_repository: BlockRepositoryDep,
    lesson_repository: LessonRepositoryDep,
    course_repository: CourseRepositoryDep,
    media_repository: MediaRepositoryDep,
    media_attachment_repository: MediaAttachmentRepositoryDep,
) -> AsyncGenerator[BlockUnitOfWork]:
    async with BlockUnitOfWork(
        session,
        lesson_repository,
        course_repository,
        block_repository,
        media_attachment_repository,
        media_repository,
    ) as uow:
        yield uow


BlockUnitOfWorkDep = Annotated[BlockUnitOfWork, Depends(get_block_uow)]


def get_block_service(
    session: SessionDep,
    uow: BlockUnitOfWorkDep,
    storage: StorageDep,
    media_service: MediaServiceDep,
) -> BlockService:
    return BlockService(
        session=session,
        block_unit_of_work=uow,
        storage=storage,
        media_service=media_service,
    )


BlockServiceDep = Annotated[BlockService, Depends(get_block_service)]
