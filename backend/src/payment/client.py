from __future__ import annotations

import logging
from typing import Any
from uuid import UUID, uuid4

import httpx

from src.core.config import settings

logger = logging.getLogger(__name__)

YOOKASSA_API_URL = "https://api.yookassa.ru/v3"

_SBP_UNAVAILABLE_HINTS = ("payment method is not available", "invalid_request")


class YooKassaClient:
    """Thin async client for the YooKassa (YooMoney) v3 API.

    Uses the redirect flow. ``capture=true`` settles immediately on
    confirmation, so there is no fund holding (no safe-deal/escrow).

    Payment method: we first try SBP (``payment_method_data={"type":"sbp"}``)
    so the buyer goes straight to a QR/QR-bank page. If the shop does not
    have SBP enabled (e.g. the test/demo store only supports bank cards and
    YooMoney wallets), we fall back to the Smart payment scenario (no
    ``payment_method_data``) so the flow always produces a ``confirmation_url``.

    Note: YooKassa does not sign webhook bodies with an HMAC in the request
    headers (webhooks are authenticated via an IP whitelist). Therefore the
    webhook handler must not be trusted solely on signature; it resolves the
    payment by ``provider_payment_id`` and only advances a row that already
    exists in a PENDING state (created by our own checkout).
    """

    def __init__(self, shop_id: str, secret_key: str) -> None:
        self._auth = httpx.BasicAuth(shop_id, secret_key)

    async def create_payment(
        self,
        *,
        amount: int,
        course_id: UUID,
        user_id: UUID,
        return_url: str,
    ) -> dict[str, Any]:
        base = self._build_payload(amount, course_id, user_id, return_url)
        sbp_payload = {**base, "payment_method_data": {"type": "sbp"}}

        try:
            return await self._post_payment(sbp_payload)
        except httpx.HTTPStatusError as exc:
            if not self._is_payment_method_unavailable(exc):
                raise
            logger.warning(
                "SBP not available for this shop, falling back to Smart payment "
                "(course=%s, status=%s)",
                course_id,
                exc.response.status_code,
            )
            return await self._post_payment(base)

    async def _post_payment(self, payload: dict[str, Any]) -> dict[str, Any]:
        async with httpx.AsyncClient(timeout=20.0) as client:
            response = await client.post(
                f"{YOOKASSA_API_URL}/payments",
                json=payload,
                auth=self._auth,
                headers={"Idempotence-Key": str(uuid4())},
            )
            response.raise_for_status()
            data = response.json()
            return data if isinstance(data, dict) else {}

    @staticmethod
    def _build_payload(
        amount: int,
        course_id: UUID,
        user_id: UUID,
        return_url: str,
    ) -> dict[str, Any]:
        return {
            "amount": {
                "value": f"{amount / 100:.2f}",
                "currency": "RUB",
            },
            "capture": True,
            "confirmation": {
                "type": "redirect",
                "return_url": return_url,
            },
            "description": f"Оплата курса: {course_id}",
            "metadata": {
                "course_id": str(course_id),
                "user_id": str(user_id),
            },
        }

    @staticmethod
    def _is_payment_method_unavailable(exc: httpx.HTTPStatusError) -> bool:
        if exc.response.status_code != 400:
            return False
        try:
            body = exc.response.json()
        except ValueError:
            return False
        text = body.get("description", "").lower()
        code = body.get("code", "").lower()
        return text in _SBP_UNAVAILABLE_HINTS or code in _SBP_UNAVAILABLE_HINTS


def build_yookassa_client() -> YooKassaClient | None:
    if not settings.payments.enabled:
        return None
    return YooKassaClient(
        shop_id=settings.payments.YOOKASSA_SHOP_ID,
        secret_key=settings.payments.YOOKASSA_SECRET_KEY,
    )
