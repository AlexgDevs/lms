from typing import Annotated

from fastapi import Depends

from src.core.dependencies import SessionDep
from src.lesson.lesson_progress.repository import LessonProgressRepository


def get_lesson_progress_repository(session: SessionDep) -> LessonProgressRepository:
    return LessonProgressRepository(session)


LessonProgressRepositoryDep = Annotated[
    LessonProgressRepository, Depends(get_lesson_progress_repository)
]
