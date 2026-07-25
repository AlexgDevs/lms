from src.core.errors import AppException, ObjectNotFoundError, ObjectAlreadyExistsError


class UserError(AppException):
    pass


class UserNotFoundError(ObjectNotFoundError, UserError):
    detail = "User not found"


class UserAlreadyExistsError(ObjectAlreadyExistsError, UserError):
    detail = "User already exit"
