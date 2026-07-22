from sqlalchemy.ext.asyncio import AsyncSession
from src.course.course_member.repository import CourseMemberRepository
from src.core.unit_of_work.base_unit_of_work import BaseUnitOfWork
from src.course.repository import CourseRepository


class CourseUnitOfWork(BaseUnitOfWork):
    courses: CourseRepository
    members: CourseMemberRepository

    def __init__(
        self,
        session: AsyncSession,
        course_repository: CourseRepository,
        course_member_repository: CourseMemberRepository,
    ) -> None:
        super().__init__(session)
        self.courses = course_repository
        self.members = course_member_repository

    def _uow_marker(self) -> None:
        pass
