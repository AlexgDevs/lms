from src.core.errors.base_errors import AppException, ObjectNotFoundError


class CourseNotCompletedError(AppException):
    detail = "Course is not completed"
    status_code = 400


class CertificateNotEnabledError(AppException):
    detail = "Certificate is not enabled for this course"
    status_code = 400


class CertificateNotReadyError(AppException):
    detail = "Certificate is not ready yet"
    status_code = 404


class CertificateUserNotFoundError(ObjectNotFoundError):
    detail = "User not found"


class CertificateCourseNotFoundError(ObjectNotFoundError):
    detail = "Course not found"
