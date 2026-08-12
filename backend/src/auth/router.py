from typing import Annotated

from fastapi import APIRouter, Body, Depends, Request, Response, status
from fastapi.security import OAuth2PasswordRequestForm

from src.auth.dependencies import AuthServiceDep
from src.auth.schemas import (
    UserRegisterSchema,
    TokenPair,
)

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
) -> TokenPair:
    return await service.login(
        username=form_data.username,
        password=form_data.password,
    )


@router.post("/refresh", summary="Refresh token")
async def refresh(
    refresh_token: Annotated[str, Body(embed=True)],
    service: AuthServiceDep,
) -> TokenPair:
    return await service.refresh(refresh_token)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    refresh_token: Annotated[str, Body(embed=True)],
    service: AuthServiceDep,
) -> None:
    await service.logout(refresh_token)
