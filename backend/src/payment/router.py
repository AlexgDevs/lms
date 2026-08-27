from uuid import UUID

from fastapi import APIRouter, HTTPException, Request, status

from src.payment.dependencies import PaymentServiceDep
from src.payment.schemas import (
    PayoutAccountSchema,
    PayoutAccountUpsertSchema,
    PaymentCheckoutResponseSchema,
    PaymentConfigSchema,
    PaymentSchema,
    PaymentStatusResponseSchema,
    YooKassaWebhookSchema,
)
from src.payment.security import is_trusted_yookassa_ip
from src.user.dependencies import UserIdDep

router = APIRouter(prefix="/payments", tags=["Payments"])


@router.post(
    "/courses/{course_id}/checkout",
    response_model=PaymentCheckoutResponseSchema,
    status_code=status.HTTP_201_CREATED,
)
async def create_checkout(
    course_id: UUID,
    user_id: UserIdDep,
    payment_service: PaymentServiceDep,
) -> PaymentCheckoutResponseSchema:
    """Create a SBP (QR) checkout for a paid course and return the redirect URL."""
    return await payment_service.create_checkout(user_id=user_id, course_id=course_id)


@router.post("/webhook/yookassa")
async def yookassa_webhook(
    request: Request,
    payload: YooKassaWebhookSchema,
    payment_service: PaymentServiceDep,
) -> dict[str, str]:
    """Handle the YooKassa webhook (payment.succeeded → enroll).

    Only accepts requests from YooKassa's official IP ranges (IP whitelist).
    """
    client_host = request.client.host if request.client else None
    if not is_trusted_yookassa_ip(client_host):
        raise HTTPException(status_code=403, detail="Untrusted webhook IP")

    await payment_service.handle_webhook(
        provider_payment_id=payload.object.id,
        status=payload.object.status,
        event=payload.event,
    )
    return {"status": "ok"}


@router.get("/me", response_model=list[PaymentSchema])
async def list_my_payments(
    user_id: UserIdDep,
    payment_service: PaymentServiceDep,
) -> list[PaymentSchema]:
    """Return the current user's purchase history."""
    return await payment_service.list_user_payments(user_id)


@router.get("/courses/{course_id}/payment", response_model=PaymentStatusResponseSchema)
async def get_course_payment_status(
    course_id: UUID,
    user_id: UserIdDep,
    payment_service: PaymentServiceDep,
) -> PaymentStatusResponseSchema:
    """Get whether the current user has already paid for a course."""
    paid = await payment_service.has_paid(user_id, course_id)
    return PaymentStatusResponseSchema(paid=paid)


@router.get("/config", response_model=PaymentConfigSchema)
async def get_payment_config(
    payment_service: PaymentServiceDep,
) -> PaymentConfigSchema:
    """Return the platform commission % and payout recipient (for the UI)."""
    return await payment_service.get_payment_config()


@router.get("/payout-account", response_model=PayoutAccountSchema | None)
async def get_payout_account(
    user_id: UserIdDep,
    payment_service: PaymentServiceDep,
) -> PayoutAccountSchema | None:
    """Return the current user's payout details (if set)."""
    return await payment_service.get_payout_account(user_id)


@router.put("/payout-account", response_model=PayoutAccountSchema)
async def upsert_payout_account(
    payload: PayoutAccountUpsertSchema,
    user_id: UserIdDep,
    payment_service: PaymentServiceDep,
) -> PayoutAccountSchema:
    """Create or update the current user's payout details."""
    return await payment_service.upsert_payout_account(user_id, payload)


@router.delete("/payout-account", status_code=status.HTTP_204_NO_CONTENT)
async def delete_payout_account(
    user_id: UserIdDep,
    payment_service: PaymentServiceDep,
) -> None:
    """Delete the current user's payout details."""
    await payment_service.delete_payout_account(user_id)
