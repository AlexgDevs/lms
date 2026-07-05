from sqlalchemy.ext.asyncio import AsyncSession
from src.lesson.lesson_progress.repository import LessonProgressRepository
from src.lesson.repository import LessonRepository
from src.module.repository import ModuleRepository
from src.course.repository import CourseRepository
from src.core.unit_of_work import BaseUnitOfWork


class LessonUnitOfWork(BaseUnitOfWork):
    def __init__(
        self,
        session: AsyncSession,
        lesson_repository: LessonRepository,
        lesson_progress_repository: LessonProgressRepository,
        course_repository: CourseRepository,
        module_repository: ModuleRepository,
    ) -> None:
        super().__init__(session)
        self.lessons = lesson_repository
        self.lessons_progress = lesson_progress_repository
        self.courses = course_repository
        self.modules = module_repository

    def _uow_marker(self) -> None:
        pass
