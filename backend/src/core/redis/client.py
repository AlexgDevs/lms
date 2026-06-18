from redis.asyncio import Redis, from_url
from redis.exceptions import ConnectionError, AuthenticationError

from src.config import settings


async def init_redis() -> Redis:
    try:
        client = from_url(
            settings.redis.REDIS_URL,
            encoding="utf-8",
            decode_responses=True,
            max_connections=settings.redis.REDIS_MAX_CONNECTIONS,
            socket_timeout=settings.redis.REDIS_SOCKET_TIMEOUT,
            socket_connect_timeout=settings.redis.REDIS_SOCKET_CONNECT_TIMEOUT,
            retry_on_timeout=settings.redis.REDIS_RETRY_ON_TIMEOUT,
        )

        client.ping()
        return client

    # TODO: add logging
    except AuthenticationError:
        raise
    except ConnectionError:
        raise
    except Exception:
        raise


async def close_redis(client: Redis) -> None:
    await client.aclose()
