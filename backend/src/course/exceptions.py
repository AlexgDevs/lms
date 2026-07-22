from src.core.errors import AppException, ObjectNotFoundError


class CourseError(AppException):
    pass


class CourseNotFoundError(ObjectNotFoundError, CourseError):
    detail = "Course not found error"


class CourseMemberNotFoundError(ObjectNotFoundError, CourseError):
    detail = "Member not found error"


class CourseMemberAlredyEnrolledError(CourseError):
    detail = "Member alredy enrolled on this course"
