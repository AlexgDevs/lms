from sqlalchemy.ext.asyncio import AsyncSession
from src.block.repository import BlockRepository
from src.submissions.repository import BlockSubmissionRepository
from src.core.unit_of_work.base_unit_of_work import BaseUnitOfWork
from src.lesson.repositories import LessonRepository


class BlockSubmissionUnitOfWork(BaseUnitOfWork):
    submissions: BlockSubmissionRepository
    blocks: BlockRepository
    lessons: LessonRepository

    def __init__(
        self,
        session: AsyncSession,
        block_submission_repository: BlockSubmissionRepository,
        block_repository: BlockRepository,
        lesson_repository: LessonRepository,
    ) -> None:
        super().__init__(session)

        self.submissions = block_submission_repository
        self.blocks = block_repository
        self.lessons = lesson_repository

    def _uow_marker(self) -> None:
        pass
