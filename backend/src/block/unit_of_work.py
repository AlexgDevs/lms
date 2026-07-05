from sqlalchemy.ext.asyncio import AsyncSession
from src.block.repository import BlockRepository
from src.lesson.repository import LessonRepository
from src.course.repository import CourseRepository
from src.core.unit_of_work import BaseUnitOfWork


class BlockUnitOfWork(BaseUnitOfWork):
    lessons: LessonRepository
    courses: CourseRepository
    blocks: BlockRepository

    def __init__(
        self,
        session: AsyncSession,
        lesson_repository: LessonRepository,
        course_repository: CourseRepository,
        block_repository: BlockRepository,
    ) -> None:
        super().__init__(session)
        self.lessons = lesson_repository
        self.courses = course_repository
        self.blocks = block_repository

    def _uow_marker(self) -> None:
        pass
