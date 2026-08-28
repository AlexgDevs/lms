import json
from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from src.core.config import settings
from src.core.services.base_service import BaseService
from src.course.course_member.schemas import CourseMemberCreateSchema
from src.course.exceptions import CourseNotFoundError
from src.course.enums import CourseStatus
from src.payment.client import YooKassaClient, build_yookassa_client
from src.payment.enums import PaymentKind, PaymentStatus, PayoutStatus
from src.payment.exceptions import (
    CourseAlreadyPaidError,
    PaymentError,
    PaymentNotFoundError,
    PaymentNotConfiguredError,
    PaymentProviderError,
)
from src.payment.repository import PaymentRepository, PayoutAccountRepository
from src.payment.schemas import (
    PayoutAccountCreateSchema,
    PayoutAccountSchema,
    PayoutAccountUpsertSchema,
    PaymentCheckoutResponseSchema,
    PaymentConfigSchema,
    PaymentCreateSchema,
    PaymentSchema,
    PaymentUpdateSchema,
)
from src.payment.unit_of_work import PaymentUnitOfWork


class PaymentService(BaseService):
    def __init__(
        self,
        session: AsyncSession,
        payment_unit_of_work: PaymentUnitOfWork,
        yookassa_client: YooKassaClient | None = None,
    ) -> None:
        self.uow = payment_unit_of_work
        self._client = yookassa_client
        super().__init__(session)

    async def create_checkout(
        self, user_id: UUID, course_id: UUID
    ) -> PaymentCheckoutResponseSchema:
        """Create a pending payment and return the SBP redirect URL."""
        client = self._get_client()

        course = await self.uow.courses.get_one(id=course_id, is_deleted=None)
        if not course:
            raise CourseNotFoundError
        if course.status != CourseStatus.PUBLISHED:
            raise CourseNotFoundError
        if course.price <= 0:
            raise PaymentError(detail="Course is free, no payment required")

        paid = await self.uow.payments.has_successful_payment(user_id, course_id)
        if paid:
            raise CourseAlreadyPaidError

        platform_fee, author_amount = self._compute_split(course.price)

        payment = await self.uow.payments.create(
            PaymentCreateSchema(
                user_id=user_id,
                course_id=course_id,
                kind=PaymentKind.COURSE,
                amount=course.price,
                meta=json.dumps({"course_id": str(course_id), "user_id": str(user_id)}),
                platform_fee=platform_fee,
                author_amount=author_amount,
                payout_status=PayoutStatus.PENDING,
            )
        )
        await self.uow.commit()

        try:
            provider_payment = await client.create_payment(
                amount=course.price,
                course_id=course_id,
                user_id=user_id,
                return_url=f"{settings.app.FRONTEND_HOST.rstrip('/')}/courses/{course_id}",
            )
        except Exception as exc:  # network / provider error
            await self.uow.payments.update(
                payment.id,
                PaymentUpdateSchema(status=PaymentStatus.FAILED),
            )
            await self.uow.commit()
            raise PaymentProviderError from exc

        provider_payment_id = provider_payment.get("id")
        confirmation_url = provider_payment.get("confirmation", {}).get(
            "confirmation_url", ""
        )

        await self.uow.payments.update(
            payment.id,
            PaymentUpdateSchema(provider_payment_id=provider_payment_id),
        )
        await self.uow.commit()

        return PaymentCheckoutResponseSchema(
            payment_id=payment.id,
            confirmation_url=confirmation_url,
            status=PaymentStatus.PENDING,
        )

    async def handle_webhook(
        self, provider_payment_id: str, status: str, event: str
    ) -> PaymentSchema:
        """Advance a payment and enroll the user on a successful webhook."""
        if event != "payment.succeeded":
            # Non-success events do not alter enrollment; still record FAILED.
            if status == "canceled":
                payment = await self.uow.payments.get_by_provider_payment_id(
                    "yookassa", provider_payment_id
                )
                if payment and payment.status == PaymentStatus.PENDING:
                    payment = await self.uow.payments.update(
                        payment.id,
                        PaymentUpdateSchema(status=PaymentStatus.FAILED),
                    )
                    await self.uow.commit()
                    return payment
            raise PaymentNotFoundError

        payment = await self.uow.payments.get_by_provider_payment_id(
            "yookassa", provider_payment_id
        )
        if not payment:
            raise PaymentNotFoundError
        if payment.status == PaymentStatus.SUCCEEDED:
            return payment

        payment = await self.uow.payments.update(
            payment.id,
            PaymentUpdateSchema(
                status=PaymentStatus.SUCCEEDED,
                paid_at=datetime.now(timezone.utc),
            ),
        )
        if payment.course_id is not None:
            await self._enroll_if_needed(payment.user_id, payment.course_id)
        await self.uow.commit()
        return payment

    async def list_user_payments(self, user_id: UUID) -> list[PaymentSchema]:
        return list(await self.uow.payments.list_user_payments(user_id))

    async def has_paid(self, user_id: UUID, course_id: UUID) -> bool:
        return await self.uow.payments.has_successful_payment(user_id, course_id)

    async def get_payout_account(self, user_id: UUID) -> PayoutAccountSchema | None:
        return await self.uow.payout_accounts.get_by_user(user_id)

    async def upsert_payout_account(
        self, user_id: UUID, payload: PayoutAccountUpsertSchema
    ) -> PayoutAccountSchema:
        existing = await self.uow.payout_accounts.get_by_user(user_id)
        if existing:
            updated = await self.uow.payout_accounts.update(
                existing.id,
                PayoutAccountSchema(
                    **payload.model_dump(exclude_unset=True),
                    id=existing.id,
                    user_id=user_id,
                    is_active=True,
                    created_at=existing.created_at,
                ),
            )
            await self.uow.commit()
            return updated

        account = await self.uow.payout_accounts.create(
            PayoutAccountCreateSchema(
                user_id=user_id,
                **payload.model_dump(exclude_unset=True),
            )
        )
        await self.uow.commit()
        return account

    async def delete_payout_account(self, user_id: UUID) -> None:
        existing = await self.uow.payout_accounts.get_by_user(user_id)
        if not existing:
            raise PaymentNotFoundError
        await self.uow.payout_accounts.delete(existing.id)
        await self.uow.commit()

    async def get_payment_config(self) -> PaymentConfigSchema:
        return PaymentConfigSchema(
            fee_percent=settings.payments.PAYMENT_PLATFORM_FEE_PERCENT,
            platform_recipient=settings.payments.PAYOUT_PLATFORM_RECIPIENT,
        )

    @staticmethod
    def _compute_split(amount: int) -> tuple[int, int]:
        fee_percent = settings.payments.PAYMENT_PLATFORM_FEE_PERCENT
        platform_fee = round(amount * fee_percent / 100)
        return platform_fee, amount - platform_fee

    async def _enroll_if_needed(self, user_id: UUID, course_id: UUID) -> None:
        existing = await self.uow.members.get_one(
            user_id=user_id, course_id=course_id, left_at=None
        )
        if existing:
            return

        data = CourseMemberCreateSchema(course_id=course_id, user_id=user_id)
        await self.uow.members.create(data)
        await self.uow.courses.increment_member_count(course_id)

    def _get_client(self) -> YooKassaClient:
        if not settings.payments.enabled and settings.payments.mode != "mock":
            raise PaymentNotConfiguredError
        if self._client is not None:
            return self._client
        client = build_yookassa_client()
        if client is None:
            raise PaymentNotConfiguredError
        self._client = client
        return client
