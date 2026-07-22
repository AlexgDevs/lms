from fastapi import status
from src.core.errors.base_errors import ObjectNotFoundError, AppException


class SubmissionError(AppException):
    pass


class InvalidSubmissionCountError(SubmissionError):
    status_code = status.HTTP_422_UNPROCESSABLE_CONTENT
    detail = "Invalid submission count"


class DuplicateBlocksInSubmissionError(SubmissionError):
    status_code = status.HTTP_422_UNPROCESSABLE_CONTENT
    detail = "Duplicate blocks in submission"


class InvalidSubmissionBlocksError(SubmissionError):
    status_code = status.HTTP_422_UNPROCESSABLE_CONTENT
    detail = "Invalid submission blocks"
