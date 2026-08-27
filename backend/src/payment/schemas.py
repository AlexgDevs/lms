from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field, ValidationInfo, field_validator

from src.core.schemas.base_schema import BaseSchema
from src.payment.enums import PaymentProvider, PaymentStatus, PayoutMethod


class PaymentSchema(BaseSchema):
    id: UUID
    user_id: UUID
    course_id: UUID
    amount: int
    currency: str
    status: PaymentStatus
    provider: PaymentProvider
    provider_payment_id: str | None
    platform_fee: int | None = None
    author_amount: int | None = None
    payout_status: str | None = None
    created_at: datetime
    paid_at: datetime | None


class PaymentCreateSchema(BaseSchema):
    user_id: UUID
    course_id: UUID
    amount: int
    currency: str = "RUB"
    status: PaymentStatus = PaymentStatus.PENDING
    provider: PaymentProvider = PaymentProvider.YOOKASSA
    provider_payment_id: str | None = None
    meta: str | None = None
    platform_fee: int | None = None
    author_amount: int | None = None
    payout_status: str | None = None


class PaymentUpdateSchema(BaseSchema):
    status: PaymentStatus | None = None
    provider_payment_id: str | None = None
    paid_at: datetime | None = None


class PaymentCheckoutResponseSchema(BaseSchema):
    payment_id: UUID
    confirmation_url: str
    status: PaymentStatus


class PaymentStatusResponseSchema(BaseSchema):
    paid: bool


class PaymentConfigSchema(BaseSchema):
    fee_percent: float
    platform_recipient: str


class PayoutAccountSchema(BaseSchema):
    id: UUID
    user_id: UUID
    method: PayoutMethod
    recipient: str
    holder_name: str | None
    bank_name: str | None
    is_active: bool
    created_at: datetime


class PayoutAccountUpsertSchema(BaseSchema):
    method: PayoutMethod
    recipient: str = Field(..., min_length=5, max_length=64)
    holder_name: str | None = Field(None, max_length=128)
    bank_name: str | None = Field(None, max_length=128)

    @field_validator("recipient")
    @classmethod
    def _validate_recipient(cls, value: str, info: ValidationInfo) -> str:
        method = info.data.get("method")
        digits = "".join(ch for ch in value if ch.isdigit())
        if method == PayoutMethod.CARD:
            if len(digits) < 12 or len(digits) > 19:
                raise ValueError("Номер карты должен содержать 12–19 цифр")
        elif method == PayoutMethod.SBP_PHONE:
            if len(digits) < 10 or len(digits) > 15:
                raise ValueError("Телефон должен содержать 10–15 цифр")
        return value


class PayoutAccountCreateSchema(PayoutAccountUpsertSchema):
    user_id: UUID


class YooKassaWebhookSchema(BaseModel):
    event: str
    type: str = "notification"
    object: YooKassaPaymentObject


class YooKassaPaymentObject(BaseModel):
    id: str
    status: str
    amount: YooKassaAmount | None = None
    metadata: dict[str, str] | None = None


class YooKassaAmount(BaseModel):
    value: str
    currency: str
