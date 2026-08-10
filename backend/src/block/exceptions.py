from fastapi import status

from src.core.errors.base_errors import AppException, ObjectNotFoundError


class BlockNotFoundError(ObjectNotFoundError):
    detail = "Block not found"


class BlockTypeNotMediaError(AppException):
    detail = "Media can only be uploaded to a media block (image/video/audio/file)"
    status_code = status.HTTP_409_CONFLICT
