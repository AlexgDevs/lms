from fastapi import status

from src.core.errors import AppException, ObjectNotFoundError


class MediaError(AppException):
    pass


class MediaNotFoundError(ObjectNotFoundError, MediaError):
    detail = "Media not found error"


class MediaForbiddenError(MediaError):
    detail = "You do not have access to this media"
    status_code = status.HTTP_403_FORBIDDEN


class MediaTooLargeError(MediaError):
    detail = "Media file is too large"
    status_code = status.HTTP_413_CONTENT_TOO_LARGE


class MediaTypeNotAllowedError(MediaError):
    detail = "Media file type is not allowed"
    status_code = status.HTTP_415_UNSUPPORTED_MEDIA_TYPE


class MediaInUseError(MediaError):
    detail = "Media is used by other objects and cannot be deleted"
    status_code = status.HTTP_409_CONFLICT
