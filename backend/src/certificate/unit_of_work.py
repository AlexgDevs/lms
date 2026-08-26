from sqlalchemy.ext.asyncio import AsyncSession

from src.core.unit_of_work.base_unit_of_work import BaseUnitOfWork
from src.certificate.repository import CertificateRepository
from src.course.repository import CourseRepository
from src.course.course_member.repository import CourseMemberRepository
from src.lesson.repository import LessonRepository
from src.lesson.lesson_progress.repository import LessonProgressRepository
from src.module.repository import ModuleRepository
from src.user.repository import UserRepository


class CertificateUnitOfWork(BaseUnitOfWork):
    certificates: CertificateRepository
    courses: CourseRepository
    members: CourseMemberRepository
    modules: ModuleRepository
    lessons: LessonRepository
    lessons_progress: LessonProgressRepository
    users: UserRepository

    def __init__(
        self,
        session: AsyncSession,
        certificate_repository: CertificateRepository,
        course_repository: CourseRepository,
        course_member_repository: CourseMemberRepository,
        module_repository: ModuleRepository,
        lesson_repository: LessonRepository,
        lesson_progress_repository: LessonProgressRepository,
        user_repository: UserRepository,
    ) -> None:
        super().__init__(session)
        self.certificates = certificate_repository
        self.courses = course_repository
        self.members = course_member_repository
        self.modules = module_repository
        self.lessons = lesson_repository
        self.lessons_progress = lesson_progress_repository
        self.users = user_repository

    def _uow_marker(self) -> None:
        pass
