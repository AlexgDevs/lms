from sqlalchemy.ext.asyncio import AsyncSession
from src.lesson.lesson_progress.repository import LessonProgressRepository
from src.block.repository import BlockRepository
from src.submissions.repository import BlockSubmissionRepository
from src.core.unit_of_work.base_unit_of_work import BaseUnitOfWork
from src.lesson.repository import LessonRepository


class BlockSubmissionUnitOfWork(BaseUnitOfWork):
    submissions: BlockSubmissionRepository
    blocks: BlockRepository
    lessons: LessonRepository
    lessons_progress: LessonProgressRepository

    def __init__(
        self,
        session: AsyncSession,
        block_submission_repository: BlockSubmissionRepository,
        block_repository: BlockRepository,
        lesson_repository: LessonRepository,
        lesson_progress_repository: LessonProgressRepository,
    ) -> None:
        super().__init__(session)

        self.submissions = block_submission_repository
        self.blocks = block_repository
        self.lessons = lesson_repository
        self.lessons_progress = lesson_progress_repository

    def _uow_marker(self) -> None:
        pass
