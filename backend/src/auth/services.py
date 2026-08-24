from datetime import datetime, timedelta, timezone
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError

from src.auth.device_parser import parse_device_name
from src.auth.exceptions import IncorrectPasswordError, InvalidRefreshTokenError
from src.user.exceptions import UserAlreadyExistsError, UserNotFoundError
from src.auth.schemas import (
    RefreshTokenCreate,
    RefreshTokenSchema,
    SessionSchema,
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
from src.core.events.event import UserLoggedIn, UserLoggedOut
from src.user.schemas import UserSchema
from src.auth.unit_of_work import AuthUnitOfWork
from src.core.services.base_service import BaseService
from src.core.config import settings

if __name__ != "__main__":
    from typing import TYPE_CHECKING

    if TYPE_CHECKING:
        from src.core.events.protocol import Event


class AuthService(BaseService):

    def __init__(
        self,
        session: AsyncSession,
        auth_unit_of_work: AuthUnitOfWork,
        event_bus: "Event | None" = None,
    ) -> None:
        super().__init__(session, event_bus)
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

    async def login(
        self,
        username: str,
        password: str,
        *,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> TokenPair:
        user = await self.uow.users.get_one(username=username)
        if not user:
            raise UserNotFoundError
        if not verify_password(password, user.password_hash):
            raise IncorrectPasswordError

        device_name = parse_device_name(user_agent)
        tokens = await self._issue_tokens(
            user.id,
            ip_address=ip_address,
            user_agent=user_agent,
            device_name=device_name,
        )
        await self.session.commit()

        if self.event_bus is not None:
            await self.event_bus.publish(
                UserLoggedIn(
                    user_id=user.id,
                    ip_address=ip_address,
                    device_name=device_name,
                )
            )

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

    async def logout(
        self,
        refresh_token: str,
        *,
        user_id: UUID | None = None,
    ) -> None:
        try:
            stored = await self._get_valid_refresh_token(refresh_token)
        except InvalidRefreshTokenError:
            return
        await self.uow.refresh_tokens.revoke(stored.id)
        await self.uow.commit()

        if self.event_bus is not None and user_id is not None:
            await self.event_bus.publish(
                UserLoggedOut(
                    user_id=user_id,
                    session_id=stored.id,
                )
            )

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

        await self.uow.users.update(
            user_id, _PwdUpdate(password_hash=hash_password(new_password))
        )
        await self.uow.commit()

    async def get_sessions(
        self, user_id: UUID, current_token_id: UUID | None
    ) -> list[SessionSchema]:
        sessions = await self.uow.refresh_tokens.get_active_sessions(user_id)
        return [
            SessionSchema(
                id=s.id,
                device_name=s.device_name,
                ip_address=s.ip_address,
                created_at=s.created_at,
                is_current=current_token_id is not None and s.id == current_token_id,
            )
            for s in sessions
        ]

    async def revoke_session(self, user_id: UUID, token_id: UUID) -> bool:
        return await self.uow.refresh_tokens.revoke_session(user_id, token_id)

    async def revoke_all_sessions(self, user_id: UUID, current_token_id: UUID) -> None:
        await self.uow.refresh_tokens.revoke_all_except(user_id, current_token_id)
        await self.uow.commit()

    async def _issue_tokens(
        self,
        user_id: UUID,
        *,
        ip_address: str | None = None,
        user_agent: str | None = None,
        device_name: str | None = None,
    ) -> TokenPair:
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
                ip_address=ip_address,
                user_agent=user_agent,
                device_name=device_name,
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
