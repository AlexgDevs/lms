from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import select, update

from src.auth.schemas import RefreshTokenSchema
from src.core.repositories import BaseRepository
from src.auth.models import RefreshToken
from src.auth.mapper import AuthMapper


class RefreshTokenRepository(BaseRepository[RefreshToken, RefreshTokenSchema]):
    model = RefreshToken
    mapper = AuthMapper

    async def revoke(self, token_id: UUID) -> None:
        statement = (
            update(RefreshToken)
            .filter_by(id=token_id)
            .values(
                {
                    "is_revoked": True,
                }
            )
        )
        await self.session.execute(statement)

    async def revoke_all(self, user_id: UUID) -> None:
        statement = (
            update(RefreshToken)
            .filter_by(user_id=user_id, is_revoked=False)
            .values(
                {
                    "is_revoked": True,
                }
            )
        )
        await self.session.execute(statement)

    async def get_active_sessions(self, user_id: UUID) -> list[RefreshTokenSchema]:
        now = datetime.now(timezone.utc)
        query = (
            select(RefreshToken)
            .filter_by(user_id=user_id, is_revoked=False)
            .filter(RefreshToken.expires_at > now)
            .order_by(RefreshToken.created_at.desc())
        )
        result = await self.session.execute(query)
        return [self.mapper.to_schema(model) for model in result.scalars().all()]

    async def revoke_session(self, user_id: UUID, token_id: UUID) -> bool:
        statement = (
            update(RefreshToken)
            .filter_by(id=token_id, user_id=user_id, is_revoked=False)
            .values(is_revoked=True)
            .returning(RefreshToken.id)
        )
        result = await self.session.execute(statement)
        return result.scalar_one_or_none() is not None

    async def revoke_all_except(self, user_id: UUID, current_token_id: UUID) -> None:
        statement = (
            update(RefreshToken)
            .filter_by(user_id=user_id, is_revoked=False)
            .filter(RefreshToken.id != current_token_id)
            .values(is_revoked=True)
        )
        await self.session.execute(statement)
