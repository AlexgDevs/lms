from fastapi import status

from src.core.errors import AppException, ObjectNotFoundError


class CourseError(AppException):
    pass


class CourseNotFoundError(ObjectNotFoundError, CourseError):
    detail = "Course not found error"


class CourseMemberNotFoundError(ObjectNotFoundError, CourseError):
    detail = "Member not found error"


class CourseMemberAlredyEnrolledError(CourseError):
    detail = "Member alredy enrolled on this course"


class CourseOwnerCannotEnrollError(CourseError):
    detail = "Owner cannot enroll on this course"


class CourseNotPublishedError(ObjectNotFoundError, CourseError):
    detail = "Course is not published yet"


class CourseAlreadyPublishedError(CourseError):
    detail = "Course is already published"
    status_code = status.HTTP_409_CONFLICT


class CourseNotUnderReviewError(CourseError):
    detail = "Course is not under review"
    status_code = status.HTTP_409_CONFLICT


class CourseIncompleteError(CourseError):
    detail = "Course does not meet the minimum requirements to be published"
    status_code = status.HTTP_422_UNPROCESSABLE_CONTENT


class CourseStatusNotAllowedError(CourseError):
    detail = "Course status can only be changed via the moderation flow"
    status_code = status.HTTP_403_FORBIDDEN


class CourseGenerateError(CourseError):
    detail = "Course generation failed"
    status_code = status.HTTP_422_UNPROCESSABLE_CONTENT


class CoursePaymentRequiredError(CourseError):
    detail = "This course requires payment before enrollment"
    status_code = status.HTTP_402_PAYMENT_REQUIRED
