from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from loguru import logger

from src.core.config import settings
from src.core.events.protocol import InMemoryEvent
from src.core.redis import init_redis, close_redis
from src.core.logging import setup_logging
from src.core.router import app_v1, notifications_router
from src.core.handlers import init_errors_handler
from src.core.postgres.session import session_maker
from src.core.storage import init_storage, close_storage
from src.core.websocket.manager import ConnectionManager
from src.notification.handler import NotificationHandler

setup_logging()


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None]:

    # ---App startup---
    logger.info("Starting up the application...")

    app.state.redis = await init_redis()
    app.state.storage = await init_storage()

    event_bus = InMemoryEvent()
    ws_manager = ConnectionManager()
    handler = NotificationHandler(
        session_factory=session_maker, ws_manager=ws_manager
    )
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

    if settings.storage.STORAGE_BACKEND == "local":
        root = settings.storage.storage_root_path
        root.mkdir(parents=True, exist_ok=True)
        app.mount("/media", StaticFiles(directory=str(root)), name="media")

    init_errors_handler(app)
    app.include_router(app_v1)
    app.include_router(notifications_router)

    return app


app = init_app()


@app.get("/hello")
async def say() -> dict[str, str]:
    logger.info("Received request to /hello endpoint")
    return {"say": "hello"}
