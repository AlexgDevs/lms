from __future__ import annotations

import ipaddress

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


def is_trusted_yookassa_ip(client_ip: str | None) -> bool:
    """Return True if ``client_ip`` belongs to YooKassa's webhook ranges."""
    if not client_ip:
        return False
    try:
        address = ipaddress.ip_address(client_ip)
    except ValueError:
        return False
    for network in _YOOKASSA_IP_NETWORKS:
        if address in ipaddress.ip_network(network, strict=False):
            return True
    return False
