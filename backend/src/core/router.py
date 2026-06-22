from fastapi import APIRouter

from src.auth import router as auth_router
from src.course import router as course_router
from src.module import router as module_router
from src.lesson import router as lesson_router
from src.core.config import settings

app_v1 = APIRouter(prefix=settings.app.API_V1_STR, tags=["App version 1"])
app_v1.include_router(auth_router)
app_v1.include_router(course_router)
app_v1.include_router(module_router)
app_v1.include_router(lesson_router)
