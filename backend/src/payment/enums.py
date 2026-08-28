from enum import StrEnum


class PaymentStatus(StrEnum):
    PENDING = "pending"
    SUCCEEDED = "succeeded"
    FAILED = "failed"


class PaymentKind(StrEnum):
    COURSE = "course"
    AI_ASSISTANT_SUBSCRIPTION = "ai_assistant_subscription"
    COURSE_GENERATION = "course_generation"


class PaymentProvider(StrEnum):
    YOOKASSA = "yookassa"


class PayoutMethod(StrEnum):
    CARD = "card"
    SBP_PHONE = "sbp_phone"


class PayoutStatus(StrEnum):
    PENDING = "pending"
    PAID = "paid"
