from uuid import UUID

from sqlalchemy import select

from src.core.repositories.base_repository import BaseRepository
from src.payment.enums import PaymentStatus
from src.payment.mapper import PaymentMapper, PayoutAccountMapper
from src.payment.models import Payment, PayoutAccount
from src.payment.schemas import PaymentSchema, PayoutAccountSchema


class PaymentRepository(BaseRepository[Payment, PaymentSchema]):
    model = Payment
    schema = PaymentSchema
    mapper = PaymentMapper

    async def get_by_provider_payment_id(
        self, provider: str, provider_payment_id: str
    ) -> PaymentSchema | None:
        query = select(self.model).where(
            self.model.provider == provider,
            self.model.provider_payment_id == provider_payment_id,
        )
        result = await self.session.execute(query)
        model = result.scalars().one_or_none()
        return self.mapper.to_schema(model) if model else None

    async def has_successful_payment(self, user_id: UUID, course_id: UUID) -> bool:
        query = (
            select(self.model.id)
            .where(
                self.model.user_id == user_id,
                self.model.course_id == course_id,
                self.model.status == PaymentStatus.SUCCEEDED,
            )
            .limit(1)
        )
        result = await self.session.execute(query)
        return result.scalars().first() is not None

    async def list_user_payments(self, user_id: UUID) -> list[PaymentSchema]:
        query = (
            select(self.model)
            .where(self.model.user_id == user_id)
            .order_by(self.model.created_at.desc())
        )
        result = await self.session.execute(query)
        return [self.mapper.to_schema(model) for model in result.scalars().all()]


class PayoutAccountRepository(BaseRepository[PayoutAccount, PayoutAccountSchema]):
    model = PayoutAccount
    schema = PayoutAccountSchema
    mapper = PayoutAccountMapper

    async def get_by_user(self, user_id: UUID) -> PayoutAccountSchema | None:
        query = select(self.model).where(
            self.model.user_id == user_id,
            self.model.is_active.is_(True),
        )
        result = await self.session.execute(query)
        model = result.scalars().one_or_none()
        return self.mapper.to_schema(model) if model else None
