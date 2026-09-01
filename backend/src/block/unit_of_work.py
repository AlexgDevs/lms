from sqlalchemy.ext.asyncio import AsyncSession
from src.block.repository import BlockRepository
from src.lesson.repository import LessonRepository
from src.course.repository import CourseRepository
from src.media.media_attachment.repository import MediaAttachmentRepository
from src.media.repository import MediaRepository
from src.core.unit_of_work import BaseUnitOfWork


class BlockUnitOfWork(BaseUnitOfWork):
    lessons: LessonRepository
    courses: CourseRepository
    blocks: BlockRepository
    media_attachments: MediaAttachmentRepository
    media: MediaRepository

    def __init__(
        self,
        session: AsyncSession,
        lesson_repository: LessonRepository,
        course_repository: CourseRepository,
        block_repository: BlockRepository,
        media_attachment_repository: MediaAttachmentRepository,
        media_repository: MediaRepository,
    ) -> None:
        super().__init__(session)
        self.lessons = lesson_repository
        self.courses = course_repository
        self.blocks = block_repository
        self.media_attachments = media_attachment_repository
        self.media = media_repository

    def _uow_marker(self) -> None:
        pass
