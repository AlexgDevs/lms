from fastapi import status

from src.core.errors import AppException


class AssistantError(AppException):
    pass


class AssistantLimitExceededError(AssistantError):
    detail = "Дневной лимит обращений к ИИ-ассистенту исчерпан"
    status_code = status.HTTP_429_TOO_MANY_REQUESTS


class AssistantGenerationInProgressError(AssistantError):
    detail = "Подсказки уже генерируются, попробуйте ещё раз"
    status_code = status.HTTP_425_TOO_EARLY


class AssistantAiUnavailableError(AssistantError):
    detail = "ИИ-ассистент временно недоступен, попробуйте позже"
    status_code = status.HTTP_503_SERVICE_UNAVAILABLE


class AssistantAiNotConfiguredError(AssistantError):
    detail = "AI gateway API key is not configured"
    status_code = status.HTTP_503_SERVICE_UNAVAILABLE


class AssistantLadderNotFoundError(AssistantError):
    detail = "Лестница подсказок больше не доступна, запросите её заново"
    status_code = status.HTTP_404_NOT_FOUND
