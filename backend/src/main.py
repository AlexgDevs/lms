from contextlib import asynccontextmanager
from typing import Awaitable, Callable, AsyncGenerator

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from loguru import logger
from starlette.responses import Response
from starlette.types import Scope

from src.core.config import settings
from src.core.events.protocol import InMemoryEvent
from src.core.rate_limit import RateLimiter, get_client_ip
from src.core.redis import init_redis, close_redis
from src.core.logging import setup_logging
from src.core.router import app_v1, notifications_router
from src.core.handlers import init_errors_handler
from src.core.postgres.session import session_maker
from src.core.storage import init_storage, close_storage
from src.core.websocket.manager import ConnectionManager
from src.notification.handler import NotificationHandler

setup_logging()

_GLOBAL_LIMIT_EXEMPT_PRECEDES = (
    "/media/",
    "/ws/",
    "/docs",
)


def _is_global_limit_exempt(path: str) -> bool:
    if path.startswith(_GLOBAL_LIMIT_EXEMPT_PRECEDES):
        return True
    if path == "/hello" or path == "/":
        return True
    return path.startswith(f"{settings.app.API_V1_STR}/openapi.json")


class MediaStaticFiles(StaticFiles):
    """Serves the local media store with ``nosniff`` so a spoofed content type
    cannot be re-interpreted by the browser (e.g. uploaded as an image but
    rendered as HTML)."""

    async def get_response(self, path: str, scope: Scope) -> Response:
        response = await super().get_response(path, scope)
        response.headers.setdefault("X-Content-Type-Options", "nosniff")
        return response


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None]:

    # ---App startup---
    logger.info("Starting up the application...")

    app.state.redis = await init_redis()
    app.state.storage = await init_storage()

    event_bus = InMemoryEvent()
    ws_manager = ConnectionManager()
    handler = NotificationHandler(session_factory=session_maker, ws_manager=ws_manager)
    handler.register(event_bus)
    app.state.event_bus = event_bus

    yield
    await close_storage(app.state.storage)
    await close_redis(app.state.redis)
    logger.info("Application shutdown complete.")


def init_app() -> FastAPI:
    app = FastAPI(
        title="FastAPI",
        version="0.1.0",
        openapi_url=f"{settings.app.API_V1_STR}/openapi.json",
        lifespan=lifespan,
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.app.ALL_CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.middleware("http")
    async def rate_limit_middleware(
        request: Request, call_next: Callable[[Request], Awaitable[Response]]
    ) -> Response:
        path = request.url.path
        if (
            not path.startswith(settings.app.API_V1_STR)
            or _is_global_limit_exempt(path)
            or request.method in ("OPTIONS", "HEAD")
        ):
            return await call_next(request)

        redis = getattr(request.app.state, "redis", None)
        if settings.rate_limit.RATE_LIMIT_GLOBAL_ENABLED and redis is not None:
            client_ip = get_client_ip(request) or "unknown"
            key = f"rl:global:{client_ip}"
            try:
                limiter = RateLimiter(redis)
                hits = await limiter.hit(key, 60)
                if hits > settings.rate_limit.RATE_LIMIT_GLOBAL_REQ_PER_MIN:
                    ttl = await redis.ttl(key)
                    response = JSONResponse(
                        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                        content={
                            "error": "RateLimitExceededError",
                            "detail": "Too many requests",
                        },
                    )
                    response.headers["Retry-After"] = str(max(int(ttl), 1))
                    return response
            except Exception:
                # Fail-open: a Redis outage must not knock out the whole API.
                return await call_next(request)

        return await call_next(request)

    if settings.storage.STORAGE_BACKEND == "local":
        root = settings.storage.storage_root_path
        root.mkdir(parents=True, exist_ok=True)
        app.mount("/media", MediaStaticFiles(directory=str(root)), name="media")

    init_errors_handler(app)
    app.include_router(app_v1)
    app.include_router(notifications_router)

    return app


app = init_app()


@app.get("/hello")
async def say() -> dict[str, str]:
    logger.info("Received request to /hello endpoint")
    return {"say": "hello"}
