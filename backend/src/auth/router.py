from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Body, Depends, Query, Request, Response, status
from fastapi.security import OAuth2PasswordRequestForm

from src.auth.dependencies import AuthServiceDep
from src.auth.security import hash_refresh_token
from src.core.rate_limit import get_client_ip
from src.auth.schemas import (
    UserRegisterSchema,
    SessionSchema,
    TokenPair,
    ForgotPasswordRequestSchema,
    ForgotPasswordResponseSchema,
    ResetPasswordRequestSchema,
    ChangePasswordRequestSchema,
    VerifyEmailRequestSchema,
    ResendVerificationRequestSchema,
    MessageResponseSchema,
)
from src.user.dependencies import AuthenticatedUserIdDep

from src.user.schemas import UserPublicSchema

router = APIRouter(
    prefix="/auth",
    tags=["Auth"],
)


@router.post(
    "/register",
    status_code=status.HTTP_201_CREATED,
    response_model=UserPublicSchema,
)
async def register(
    form_data: UserRegisterSchema,
    service: AuthServiceDep,
    request: Request,
    response: Response,
) -> UserPublicSchema:
    user = await service.register(form_data)
    response.headers["location"] = f"{request.url.path}/{user.id}"
    return UserPublicSchema.model_validate(user)


@router.post("/login")
async def login(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    service: AuthServiceDep,
    request: Request,
) -> TokenPair:
    return await service.login(
        username=form_data.username,
        password=form_data.password,
        ip_address=get_client_ip(request),
        user_agent=request.headers.get("user-agent"),
    )


@router.post("/refresh", summary="Refresh token")
async def refresh(
    refresh_token: Annotated[str, Body(embed=True)],
    service: AuthServiceDep,
    request: Request,
) -> TokenPair:
    return await service.refresh(
        refresh_token,
        ip_address=get_client_ip(request),
        user_agent=request.headers.get("user-agent"),
    )


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    refresh_token: Annotated[str, Body(embed=True)],
    service: AuthServiceDep,
    user_id: AuthenticatedUserIdDep,
) -> None:
    await service.logout(refresh_token, user_id=user_id)


@router.get(
    "/sessions",
    response_model=list[SessionSchema],
    summary="List active sessions",
)
async def list_sessions(
    user_id: AuthenticatedUserIdDep,
    service: AuthServiceDep,
    current_token: Annotated[str, Query(description="Current refresh token")],
) -> list[SessionSchema]:
    token_hash = hash_refresh_token(current_token)
    token = await service.uow.refresh_tokens.get_one(token_hash=token_hash)
    current_token_id = token.id if token is not None else None
    return await service.get_sessions(user_id, current_token_id)


@router.delete(
    "/sessions/{session_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Revoke a specific session",
)
async def revoke_session(
    session_id: str,
    user_id: AuthenticatedUserIdDep,
    service: AuthServiceDep,
) -> None:
    await service.revoke_session(user_id, UUID(session_id))


@router.delete(
    "/sessions",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Revoke all sessions except current",
)
async def revoke_all_sessions(
    user_id: AuthenticatedUserIdDep,
    service: AuthServiceDep,
    current_token: Annotated[str, Query(description="Current refresh token")],
) -> None:
    token_hash = hash_refresh_token(current_token)
    token = await service.uow.refresh_tokens.get_one(token_hash=token_hash)
    if token:
        await service.revoke_all_sessions(user_id, token.id)


@router.post(
    "/forgot-password",
    summary="Request password reset",
    response_model=ForgotPasswordResponseSchema,
)
async def forgot_password(
    payload: ForgotPasswordRequestSchema,
    service: AuthServiceDep,
    request: Request,
) -> ForgotPasswordResponseSchema:
    await service.forgot_password(payload.email, client_ip=get_client_ip(request))
    return ForgotPasswordResponseSchema(
        message="If the email exists, a reset link has been sent.",
    )


@router.post(
    "/verify-email",
    summary="Verify email with token",
    response_model=MessageResponseSchema,
)
async def verify_email(
    payload: VerifyEmailRequestSchema,
    service: AuthServiceDep,
) -> MessageResponseSchema:
    await service.verify_email(payload.token)
    return MessageResponseSchema(message="Email verified successfully.")


@router.post(
    "/resend-verification",
    summary="Resend email verification",
    response_model=MessageResponseSchema,
)
async def resend_verification(
    payload: ResendVerificationRequestSchema,
    service: AuthServiceDep,
    request: Request,
) -> MessageResponseSchema:
    await service.resend_verification(payload.email, client_ip=get_client_ip(request))
    return MessageResponseSchema(
        message="If the email exists, a verification link has been sent."
    )


@router.post(
    "/reset-password",
    summary="Reset password with token",
)
async def reset_password(
    payload: ResetPasswordRequestSchema,
    service: AuthServiceDep,
) -> dict[str, str]:
    await service.reset_password(payload.token, payload.new_password)
    return {"message": "Password has been reset successfully."}
