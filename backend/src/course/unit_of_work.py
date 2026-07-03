from sqlalchemy.ext.asyncio import AsyncSession
from src.core.unit_of_work.base_unit_of_work import BaseUnitOfWork
from src.course.repository import CourseRepository


class CourseUnitOfWork(BaseUnitOfWork):
    courses: CourseRepository

    def __init__(
        self, session: AsyncSession, course_repository: CourseRepository
    ) -> None:
        super().__init__(session)
        self.courses = course_repository

    def _uow_marker(self) -> None:
        pass
