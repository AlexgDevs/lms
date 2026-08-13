from sqlalchemy.ext.asyncio import AsyncSession
from src.course.category.repository import CategoryRepository
from src.course.course_member.repository import CourseMemberRepository
from src.core.unit_of_work.base_unit_of_work import BaseUnitOfWork
from src.course.repository import CourseRepository
from src.media.media_attachment.repository import MediaAttachmentRepository
from src.media.repository import MediaRepository


class CourseUnitOfWork(BaseUnitOfWork):
    courses: CourseRepository
    members: CourseMemberRepository
    media_attachments: MediaAttachmentRepository
    media: MediaRepository
    categories: CategoryRepository

    def __init__(
        self,
        session: AsyncSession,
        course_repository: CourseRepository,
        course_member_repository: CourseMemberRepository,
        media_attachment_repository: MediaAttachmentRepository,
        media_repository: MediaRepository,
        category_repository: CategoryRepository,
    ) -> None:
        super().__init__(session)
        self.courses = course_repository
        self.members = course_member_repository
        self.media_attachments = media_attachment_repository
        self.media = media_repository
        self.categories = category_repository

    def _uow_marker(self) -> None:
        pass
