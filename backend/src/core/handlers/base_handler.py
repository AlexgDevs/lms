from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from src.core.errors.base_errors import (
    AppException,
    ObjectNotFoundError,
    ObjectAlreadyExistsError,
)

ERRORS_MAP = {
    ObjectNotFoundError: status.HTTP_404_NOT_FOUND,
    ObjectAlreadyExistsError: status.HTTP_409_CONFLICT,
}


def init_errors_handler(app: FastAPI) -> None:
    @app.exception_handler(AppException)
    async def app_errors_handler(request: Request, exc: AppException) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "error": exc.__class__.__name__,
                "detail": exc.detail,
            },
        )
