from src.core.errors.base_errors import ObjectNotFoundError


class LessonNotFoundError(ObjectNotFoundError):
    detail = "Lesson not found"
