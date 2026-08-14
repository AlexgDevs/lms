from fastapi import status

from src.core.errors import AppException, ObjectNotFoundError


class TgpError(AppException):
    pass


class TgpNotEnabledError(TgpError):
    detail = "TGP is not enabled for this course"
    status_code = status.HTTP_404_NOT_FOUND


class TgpQuestionNotFoundError(ObjectNotFoundError, TgpError):
    detail = "TGP question not found"


class TgpNoQuestionsError(TgpError):
    detail = "TGP test has not been generated yet for this course"
    status_code = status.HTTP_409_CONFLICT


class TgpInvalidAnswersError(TgpError):
    detail = "Answers do not match the generated TGP test"
    status_code = status.HTTP_422_UNPROCESSABLE_CONTENT


class NotEnoughModulesError(TgpError):
    detail = "Course must contain at least 5 modules to generate a TGP test"
    status_code = status.HTTP_422_UNPROCESSABLE_CONTENT


class TgpCooldownError(TgpError):
    detail = "TGP was already generated recently"
    status_code = status.HTTP_425_TOO_EARLY


class TgpGenerationInProgressError(TgpError):
    detail = "TGP generation is already in progress"
    status_code = status.HTTP_425_TOO_EARLY


class TgpAiNotConfiguredError(TgpError):
    detail = "OpenRouter API key is not configured"
    status_code = status.HTTP_503_SERVICE_UNAVAILABLE


class TgpAiUnavailableError(TgpError):
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


class TgpGeminiRateLimitError(TgpAiUnavailableError):
    detail = "AI gateway rate limit exceeded, please try again later"
    status_code = status.HTTP_503_SERVICE_UNAVAILABLE


class TgpAiResponseError(TgpError):
    detail = "AI gateway returned an invalid response"
    status_code = status.HTTP_502_BAD_GATEWAY
