from sqlalchemy.ext.asyncio import AsyncSession
from src.lesson.repository import LessonRepository
from src.module.repository import ModuleRepository
from src.course.repository import CourseRepository
from src.core.unit_of_work import BaseUnitOfWork


class LessonUnitOfWork(BaseUnitOfWork):
    def __init__(
        self,
        session: AsyncSession,
        lesson_repository: LessonRepository,
        course_repository: CourseRepository,
        module_repository: ModuleRepository,
    ) -> None:
        super().__init__(session)
        self.lessons = lesson_repository
        self.courses = course_repository
        self.modules = module_repository

    def _uow_marker(self) -> None:
        pass
