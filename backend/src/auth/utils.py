from fastapi import Response
from src.config import settings


def set_tokens_cookie(
    response: Response, access_token: str, refresh_token: str
) -> None:
    """
    Function to set tokens cookie
    :param response: response object
    :param access_token: access token
    :param refresh_token: refresh token
    """
    response.set_cookie(
        "access_token",
        access_token,
        httponly=True,
        secure=settings.app.secure_cookies,
        samesite="lax",
        max_age=settings.app.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/",
    )
    response.set_cookie(
        "refresh_token",
        refresh_token,
        httponly=True,
        secure=settings.app.secure_cookies,
        samesite="lax",
        max_age=settings.app.REFRESH_TOKEN_EXPIRE_SECONDS,
        path=f"{settings.app.API_V1_STR}/auth/refresh",
    )
