from __future__ import annotations

from typing import Annotated

from fastapi import Depends
from fastapi.requests import Request
from redis.asyncio import Redis

from src.core.config import settings
from src.core.dependencies import RedisDep


def resolve_client_ip(peer: str | None, forwarded_for: str | None) -> str:
    """Resolve the real client IP, honouring trusted reverse proxies.

    When the socket peer is listed in ``RATE_LIMIT_TRUSTED_PROXY_IPS``, the
    nearest non-trusted hop of the ``X-Forwarded-For`` chain is returned; a
    direct request ignores the header, so a spoofed ``X-Forwarded-For`` cannot
    fool the per-IP limits.
    """
    if not peer:
        return ""
    trusted = set(settings.rate_limit.RATE_LIMIT_TRUSTED_PROXY_IPS)
    if peer in trusted:
        chain = [
            part.strip() for part in (forwarded_for or "").split(",") if part.strip()
        ]
        for ip in reversed(chain):
            if ip not in trusted:
                return ip
    return peer


def get_client_ip(request: Request) -> str:
    peer = request.client.host if request.client else None
    return resolve_client_ip(peer, request.headers.get("x-forwarded-for"))


class RateLimiter:
    """Fixed-window rate limiter backed by Redis.

    Uses the same ``INCR`` + ``EXPIRE`` primitive as the AI assistant cooldowns
    (``redis.asyncio``), so no extra dependencies or a second Redis connection.
    """

    def __init__(self, redis: Redis) -> None:
        self._redis = redis

    async def hit(self, key: str, window_seconds: int) -> int:
        """Increment the counter for ``key`` (fixed window) and return the count."""
        count = await self._redis.incr(key)
        if count == 1:
            await self._redis.expire(key, window_seconds)
        return count

    async def reset(self, key: str) -> None:
        """Clear the counter for ``key`` (e.g. after a successful login)."""
        await self._redis.delete(key)


def get_rate_limiter(redis: RedisDep) -> RateLimiter:
    return RateLimiter(redis)


RateLimiterDep = Annotated[RateLimiter, Depends(get_rate_limiter)]
