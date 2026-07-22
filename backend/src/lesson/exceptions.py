from src.core.errors.base_errors import ObjectNotFoundError


class LessonNotFoundError(ObjectNotFoundError):
    detail = "Lesson not found"


class LessonProgressNotFoundError(ObjectNotFoundError):
    detail = "Lesson progress not found"
