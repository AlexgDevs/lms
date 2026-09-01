from fastapi import status

from src.core.errors.base_errors import AppException, ObjectNotFoundError


class ReviewError(AppException):
    pass


class ReviewNotFoundError(ObjectNotFoundError, ReviewError):
    detail = "Review not found error"


class ReviewTargetNotFoundError(ObjectNotFoundError, ReviewError):
    detail = "Target entity for review not found"


class ReviewParentNotFoundError(ObjectNotFoundError, ReviewError):
    detail = "Parent review not found"


class ReviewAlreadyExistsError(ReviewError):
    detail = "A review already exists for this user and target"
    status_code = status.HTTP_409_CONFLICT


class ReviewInvalidRatingError(ReviewError):
    detail = "Rating must be an integer between 1 and 5"
    status_code = status.HTTP_422_UNPROCESSABLE_CONTENT


class ReviewNotAllowedError(ReviewError):
    detail = "You are not allowed to perform this action"
    status_code = status.HTTP_403_FORBIDDEN


class ReviewReplyNotAllowedError(ReviewError):
    detail = (
        "A reply cannot carry a rating and must target the same entity as its parent"
    )
    status_code = status.HTTP_422_UNPROCESSABLE_CONTENT
