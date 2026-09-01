from src.core.mappers.base_mapper import BaseMapper
from src.payment.models import Payment, PayoutAccount
from src.payment.schemas import PaymentSchema, PayoutAccountSchema


class PaymentMapper(BaseMapper[Payment, PaymentSchema]):
    orm_class = Payment
    schema_class = PaymentSchema


class PayoutAccountMapper(BaseMapper[PayoutAccount, PayoutAccountSchema]):
    orm_class = PayoutAccount
    schema_class = PayoutAccountSchema
