from fastapi import APIRouter

from src.auth import router as auth_router
from src.course.router import router as course_router
from src.module import router as module_router
from src.lesson.router import router as lesson_router
from src.lesson.lesson_progress.router import (
    router as lesson_prorgress_router,
    course_progress_router as lesson_course_progress_router,
)
from src.block import router as block_router
from src.submissions import router as submissions_router
from src.media import router as media_router
from src.profile import router as profile_router
from src.user.router import router as user_router
from src.core.config import settings

app_v1 = APIRouter(prefix=settings.app.API_V1_STR)
app_v1.include_router(auth_router)
app_v1.include_router(course_router)
app_v1.include_router(module_router)
app_v1.include_router(lesson_router)
app_v1.include_router(block_router)
app_v1.include_router(submissions_router)
app_v1.include_router(media_router)
app_v1.include_router(lesson_prorgress_router)
app_v1.include_router(lesson_course_progress_router)
app_v1.include_router(user_router)
app_v1.include_router(profile_router)
