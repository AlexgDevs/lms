from sqlalchemy.ext.asyncio import AsyncSession

from src.block.repository import BlockRepository
from src.core.unit_of_work.base_unit_of_work import BaseUnitOfWork
from src.course.course_member.repository import CourseMemberRepository
from src.course.repository import CourseRepository
from src.lesson.repository import LessonRepository
from src.module.repository import ModuleRepository
from src.submissions.repository import BlockSubmissionRepository


class AssistantUnitOfWork(BaseUnitOfWork):
    courses: CourseRepository
    lessons: LessonRepository
    modules: ModuleRepository
    blocks: BlockRepository
    submissions: BlockSubmissionRepository
    members: CourseMemberRepository

    def __init__(
        self,
        session: AsyncSession,
        course_repository: CourseRepository,
        lesson_repository: LessonRepository,
        module_repository: ModuleRepository,
        block_repository: BlockRepository,
        submission_repository: BlockSubmissionRepository,
        course_member_repository: CourseMemberRepository,
    ) -> None:
        super().__init__(session)
        self.courses = course_repository
        self.lessons = lesson_repository
        self.modules = module_repository
        self.blocks = block_repository
        self.submissions = submission_repository
        self.members = course_member_repository

    def _uow_marker(self) -> None:
        pass
