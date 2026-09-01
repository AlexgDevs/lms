from __future__ import annotations

import ipaddress
from collections.abc import Iterable

from src.core.config import settings

# Official YooKassa (YooMoney) webhook source IP networks.
# https://yookassa.ru/developers/using-api/webhooks#notifications-authenticity-verify
_YOOKASSA_IP_NETWORKS: tuple[str, ...] = (
    "185.71.76.0/27",
    "185.71.77.0/27",
    "77.75.153.0/25",
    "77.75.156.11",
    "77.75.156.35",
    "77.75.154.128/25",
    "2a02:5180::/32",
)

_LOCAL_HOSTS = frozenset({"127.0.0.1", "localhost", "::1"})


def resolve_client_ips(peer: str | None, forwarded_for: str | None = None) -> list[str]:
    """Resolve the effective client IP(s), honouring trusted reverse proxies.

    Returns the socket peer plus the nearest non-trusted hop of the
    ``X-Forwarded-For`` chain — but only when the peer itself is listed in
    ``YOOKASSA_TRUSTED_PROXY_IPS``. A direct request ignores the header entirely,
    so a spoofed ``X-Forwarded-For`` cannot fool the whitelist.
    """
    peers = [peer] if peer else []
    trusted = set(settings.payments.YOOKASSA_TRUSTED_PROXY_IPS)
    if peer not in trusted:
        return peers
    chain = [part.strip() for part in (forwarded_for or "").split(",") if part.strip()]
    for ip in reversed(chain):
        if ip not in trusted:
            peers.append(ip)
            break
    return peers


def is_trusted_yookassa_ip(client_ips: Iterable[str] | None) -> bool:
    """Return True if any candidate client IP belongs to YooKassa.

    The IP whitelist is a defense-in-depth layer; the authoritative check is the
    authenticated ``GET /v3/payments/{id}`` re-verification (see service).
    """
    # Dev escape hatch: allow local delivery so the webhook flow can be tested
    # without real YooKassa. It only applies in mock mode, so a leaked flag in
    # production cannot be used to enroll a course from localhost.
    dev_accept = (
        settings.payments.PAYMENT_WEBHOOK_DEV_ACCEPT
        and settings.payments.mode == "mock"
    )
    for ip in client_ips or ():
        if dev_accept and ip in _LOCAL_HOSTS:
            return True
        if _is_yookassa_ip(ip):
            return True
    return False


def _is_yookassa_ip(ip: str) -> bool:
    try:
        address = ipaddress.ip_address(ip)
    except ValueError:
        return False
    return any(
        address in ipaddress.ip_network(network, strict=False)
        for network in _YOOKASSA_IP_NETWORKS
    )
