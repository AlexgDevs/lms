from sqlalchemy.ext.asyncio import AsyncSession

from src.ai.repository import TgpQuestionRepository
from src.core.unit_of_work.base_unit_of_work import BaseUnitOfWork
from src.course.course_member.repository import CourseMemberRepository
from src.course.repository import CourseRepository
from src.module.repository import ModuleRepository


class AiUnitOfWork(BaseUnitOfWork):
    questions: TgpQuestionRepository
    courses: CourseRepository
    modules: ModuleRepository
    members: CourseMemberRepository

    def __init__(
        self,
        session: AsyncSession,
        question_repository: TgpQuestionRepository,
        course_repository: CourseRepository,
        module_repository: ModuleRepository,
        course_member_repository: CourseMemberRepository,
    ) -> None:
        super().__init__(session)
        self.questions = question_repository
        self.courses = course_repository
        self.modules = module_repository
        self.members = course_member_repository

    def _uow_marker(self) -> None:
        pass
