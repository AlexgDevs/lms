from fastapi import status

from src.core.errors import AppException


class AiError(AppException):
    pass


class AiNotConfiguredError(AiError):
    detail = "AI gateway API key is not configured"
    status_code = status.HTTP_503_SERVICE_UNAVAILABLE


class AiUnavailableError(AiError):
    detail = "AI gateway is temporarily unavailable, please try again later"
    status_code = status.HTTP_503_SERVICE_UNAVAILABLE

    def __init__(
        self,
        detail: str | None = None,
        status_code: int | None = None,
        retry_after: int | None = None,
    ) -> None:
        self.retry_after = retry_after
        super().__init__(detail=detail, status_code=status_code)


class AiRateLimitError(AiUnavailableError):
    detail = "AI gateway rate limit exceeded, please try again later"
    status_code = status.HTTP_503_SERVICE_UNAVAILABLE


class AiResponseError(AiError):
    detail = "AI gateway returned an invalid response"
    status_code = status.HTTP_502_BAD_GATEWAY
