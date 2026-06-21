from sqlalchemy.ext.asyncio import AsyncSession
from src.course.repository import CourseRepository
from src.core.unit_of_work import BaseUnitOfWork
from src.module.repository import ModuleRepository


class ModuleUnitOfWork(BaseUnitOfWork):
    def __init__(
        self,
        session: AsyncSession,
        module_repository: ModuleRepository,
        course_repository: CourseRepository,
    ) -> None:
        super().__init__(session)
        self.modules = module_repository
        self.courses = course_repository

    def _uow_marker(self) -> None:
        pass
