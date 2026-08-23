from datetime import datetime, timedelta, timezone
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError

from src.auth.exceptions import IncorrectPasswordError, InvalidRefreshTokenError
from src.user.exceptions import UserAlreadyExistsError, UserNotFoundError
from src.auth.schemas import (
    RefreshTokenCreate,
    RefreshTokenSchema,
    TokenPair,
    UserCreateSchema,
    UserRegisterSchema,
)
from src.auth.security import (
    create_access_token,
    create_refresh_token,
    create_reset_token,
    decode_reset_token,
    hash_password,
    hash_refresh_token,
    verify_password,
)
from src.user.schemas import UserSchema
from src.auth.unit_of_work import AuthUnitOfWork
from src.core.services.base_service import BaseService
from src.core.config import settings


class AuthService(BaseService):

    def __init__(
        self,
        session: AsyncSession,
        auth_unit_of_work: AuthUnitOfWork,
    ) -> None:
        super().__init__(session)
        self.uow = auth_unit_of_work

    async def register(self, form_data: UserRegisterSchema) -> UserSchema:
        try:
            user_data = UserCreateSchema(
                **form_data.model_dump(),
                password_hash=hash_password(form_data.password),
            )

            new_user = await self.uow.users.create(user_data)
            await self.session.commit()
            return new_user
        except IntegrityError:
            raise UserAlreadyExistsError

    async def login(self, username: str, password: str) -> TokenPair:
        user = await self.uow.users.get_one(username=username)
        if not user:
            raise UserNotFoundError
        if not verify_password(password, user.password_hash):
            raise IncorrectPasswordError
        tokens = await self._issue_tokens(user.id)
        await self.session.commit()
        return TokenPair(
            access_token=tokens.access_token,
            refresh_token=tokens.refresh_token,
        )

    async def refresh(self, refresh_token: str) -> TokenPair:
        stored = await self._get_valid_refresh_token(refresh_token)
        # Refresh Token Rotation
        await self.uow.refresh_tokens.revoke(stored.id)
        tokens = await self._issue_tokens(stored.user_id)
        await self.uow.commit()
        return tokens

    async def logout(self, refresh_token: str) -> None:
        try:
            stored = await self._get_valid_refresh_token(refresh_token)
        except InvalidRefreshTokenError:
            return
        await self.uow.refresh_tokens.revoke(stored.id)
        await self.uow.commit()

    async def forgot_password(self, email: str) -> str | None:
        user = await self.uow.users.get_one(email=email)
        if not user:
            return None
        return create_reset_token(user.id)

    async def reset_password(self, token: str, new_password: str) -> None:
        user_id = decode_reset_token(token)
        user = await self.uow.users.get_one(id=user_id)
        if not user:
            raise UserNotFoundError
        from pydantic import BaseModel

        class _PwdUpdate(BaseModel):
            password_hash: str

        await self.uow.users.update(user_id, _PwdUpdate(password_hash=hash_password(new_password)))
        await self.uow.commit()

    async def _issue_tokens(self, user_id: UUID) -> TokenPair:
        access_token = create_access_token(user_id)
        refresh_token, refresh_token_hash = create_refresh_token()
        expires_at = datetime.now(timezone.utc) + timedelta(
            days=settings.app.REFRESH_TOKEN_EXPIRE_DAYS
        )
        await self.uow.refresh_tokens.create(
            RefreshTokenCreate(
                user_id=user_id,
                token_hash=refresh_token_hash,
                expires_at=expires_at,
            )
        )
        return TokenPair(access_token=access_token, refresh_token=refresh_token)

    async def _get_valid_refresh_token(self, refresh_token: str) -> RefreshTokenSchema:
        token_hash = hash_refresh_token(refresh_token)
        stored = await self.uow.refresh_tokens.get_one(token_hash=token_hash)
        if not stored or stored.expires_at <= datetime.now(timezone.utc):
            raise InvalidRefreshTokenError
        if stored.is_revoked:
            # Reuse detected - potential token theft, revoke all user sessions
            await self.uow.refresh_tokens.revoke_all(stored.user_id)
            await self.uow.commit()
            raise InvalidRefreshTokenError
        return stored
