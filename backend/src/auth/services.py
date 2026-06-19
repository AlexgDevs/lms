from datetime import datetime, timedelta, timezone
from uuid import UUID

from fastapi import HTTPException, status
from redis.asyncio import Redis
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from src.auth.schemas import (
    AccessTokenPayload,
    RefreshTokenCreateSchema,
    TokenPair,
    UserCreateSchema,
    UserLoginSchema,
    UserRegisterSchema,
)
from src.auth.security import (
    create_access_token,
    create_refresh_token,
    hash_password,
    hash_token,
    verify_password,
)
from src.user.schemas import UserSchema
from src.auth.unit_of_work import AuthUnitOfWork
from src.core.services.base_service import BaseService
from src.config import settings


class AuthService(BaseService):
    def __init__(
        self,
        session: AsyncSession,
        auth_unit_of_work: AuthUnitOfWork,
        redis_client: Redis,
    ):
        self.uow = auth_unit_of_work
        self.redis_client = redis_client
        super().__init__(session)

    async def create_user(self, user_data: UserRegisterSchema) -> UserSchema:
        try:
            user_data_to_add = UserCreateSchema(
                **user_data.model_dump(),
                password_hash=hash_password(user_data.password),
            )
            user = await self.uow.users.create(user_data_to_add)
            await self.uow.commit()
            return user
        except IntegrityError:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT, detail="User already exists"
            )

    async def authenticate_user(self, user_data: UserLoginSchema) -> TokenPair:
        user = await self.uow.users.get_one(username=user_data.username)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )

        if not verify_password(user_data.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect password",
            )

        return await self._issue_tokens(user.id)

    async def refresh(self, refresh_token_raw: str) -> TokenPair:
        token_hash = hash_token(refresh_token_raw)
        refresh_token = await self.uow.auth.get_one(
            token_hash=token_hash,
        )
        if not refresh_token or refresh_token.expires_at < datetime.now(timezone.utc):
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid refresh token")

        if refresh_token.is_revoked:
            await self.uow.auth.revoke_all_tokens(refresh_token.user_id)
            await self.uow.commit()
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Compromise detected")

        user_id = refresh_token.user_id
        if not user_id:
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid refresh token")

        await self.uow.auth.revoke_token(refresh_token.id)
        await self.uow.commit()

        return await self._issue_tokens(user_id)

    async def _issue_tokens(self, user_id: UUID) -> TokenPair:
        payload = AccessTokenPayload(sub=user_id)
        access_token = create_access_token(payload)
        refresh_token, refresh_token_hash = create_refresh_token()

        refresh_token_to_add = RefreshTokenCreateSchema(
            token_hash=refresh_token_hash,
            user_id=user_id,
            expires_at=datetime.now(timezone.utc)
            + timedelta(days=settings.app.REFRESH_TOKEN_EXPIRE_DAYS),
        )
        await self.uow.auth.create(refresh_token_to_add)
        await self.uow.commit()

        return TokenPair(
            access_token=access_token,
            refresh_token=refresh_token,
        )
