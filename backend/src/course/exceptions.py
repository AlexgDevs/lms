from src.core.errors import AppException, ObjectNotFoundError


class CourseNotFoundError(ObjectNotFoundError, AppException):
    detail = "Course not found error"
