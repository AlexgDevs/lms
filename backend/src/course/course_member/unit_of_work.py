from sqlalchemy.ext.asyncio import AsyncSession

from src.core.unit_of_work.base_unit_of_work import BaseUnitOfWork
from src.course.repository import CourseRepository
from src.course.course_member.repository import CourseMemberRepository


class CourseMemberUnitOfWork(BaseUnitOfWork):
    course_members: CourseMemberRepository
    courses: CourseRepository

    def __init__(
        self,
        session: AsyncSession,
        course_member_repository: CourseMemberRepository,
        course_repository: CourseRepository,
    ) -> None:
        super().__init__(session)
        self.course_members = course_member_repository
        self.courses = course_repository

    def _uow_marker(self) -> None: ...
