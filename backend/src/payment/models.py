from datetime import datetime
from uuid import UUID

from sqlalchemy import Boolean, DateTime, ForeignKey, Index, Integer, String, Text, text
from sqlalchemy.orm import Mapped, mapped_column

from src.core.postgres.base import UUIDBase
from src.core.postgres.types import str_128, timestamp
from src.payment.enums import (
    PaymentKind,
    PayoutMethod,
    PaymentProvider,
    PaymentStatus,
)


class Payment(UUIDBase):
    """A purchase attempt for a paid course.

    One row per checkout attempt. ``provider_payment_id`` is stable across
    retries for the same provider object, so it is unique. Status transitions
    PENDING -> SUCCEEDED (on webhook ``payment.succeeded``) or FAILED.

    ``platform_fee`` / ``author_amount`` capture the split of the purchase
    amount (platform commission vs. the course author) at checkout time.
    """

    __tablename__ = "payments"

    user_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
    )
    course_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("courses.id", ondelete="CASCADE"),
        index=True,
    )
    kind: Mapped[PaymentKind] = mapped_column(
        String(32),
        server_default=PaymentKind.COURSE.value,
        default=PaymentKind.COURSE,
    )
    amount: Mapped[int]
    currency: Mapped[str] = mapped_column(String(3), default="RUB")
    status: Mapped[PaymentStatus] = mapped_column(
        String(32),
        default=PaymentStatus.PENDING,
    )
    provider: Mapped[PaymentProvider] = mapped_column(
        String(32),
        default=PaymentProvider.YOOKASSA,
    )
    provider_payment_id: Mapped[str | None] = mapped_column(String(128))
    meta: Mapped[str | None] = mapped_column("metadata", Text)
    platform_fee: Mapped[int | None] = mapped_column(Integer)
    author_amount: Mapped[int | None] = mapped_column(Integer)
    payout_status: Mapped[str | None] = mapped_column(String(32))
    created_at: Mapped[timestamp]
    paid_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    __table_args__ = (
        Index(
            "uq_payment_provider_payment_id",
            "provider",
            "provider_payment_id",
            unique=True,
        ),
    )


class PayoutAccount(UUIDBase):
    """Payment details of a course author (site's seller).

    The single active record per user to which the author's share of course
    revenue should be paid. ``method`` is either a bank card (``card``) or a
    phone number for SBP payouts (``sbp_phone``); ``recipient`` holds the
    number. Only basic format validation is performed at the schema level.
    """

    __tablename__ = "payout_accounts"

    user_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        index=True,
    )
    method: Mapped[str_128] = mapped_column(String(32), default=PayoutMethod.CARD)
    recipient: Mapped[str_128]
    holder_name: Mapped[str | None] = mapped_column(String(128))
    bank_name: Mapped[str | None] = mapped_column(String(128))
    is_active: Mapped[bool] = mapped_column(
        Boolean(), server_default="true", default=True
    )
    created_at: Mapped[timestamp]
    updated_at: Mapped[timestamp]
