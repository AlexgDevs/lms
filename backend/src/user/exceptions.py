from fastapi import status

from src.core.errors import (
    AppException,
    ObjectAlreadyExistsError,
    ObjectNotFoundError,
)


class UserError(AppException):
    pass


class UserNotFoundError(ObjectNotFoundError, UserError):
    detail = "User not found"


class UserAlreadyExistsError(ObjectAlreadyExistsError, UserError):
    detail = "User already exit"


class UserNotStaffError(UserError):
    detail = "Staff privileges required"
    status_code = status.HTTP_403_FORBIDDEN


class UserNotVerifiedError(UserError):
    detail = "Email not verified"
    status_code = status.HTTP_403_FORBIDDEN


class UserNotActiveError(UserError):
    detail = "Account is deactivated"
    status_code = status.HTTP_403_FORBIDDEN
