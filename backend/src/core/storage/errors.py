from fastapi import status

from src.core.errors.base_errors import AppException, ObjectNotFoundError


class StorageError(AppException):
    """Base error for object storage infrastructure failures."""

    detail = "Storage operation failed"
    status_code = status.HTTP_500_INTERNAL_SERVER_ERROR


class StorageObjectNotFoundError(ObjectNotFoundError):
    detail = "Stored object not found"
