from fastapi import status

from src.core.errors import AppException


class CodeExecError(AppException):
    pass


class CodeExecUnavailableError(CodeExecError):
    detail = "Code execution service is temporarily unavailable, please try again later"
    status_code = status.HTTP_503_SERVICE_UNAVAILABLE


class CodeExecTimeoutError(CodeExecError):
    detail = "Code execution timed out, please try again"
    status_code = status.HTTP_504_GATEWAY_TIMEOUT


class CodeExecValidationError(CodeExecError):
    detail = "Invalid code execution request"
    status_code = status.HTTP_422_UNPROCESSABLE_CONTENT
