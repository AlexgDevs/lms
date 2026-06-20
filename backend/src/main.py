from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from loguru import logger

from src.core.redis import init_redis, close_redis
from src.core.logging import setup_logging
from src.core.router import app_v1
from src.core.handlers import init_errors_handler

setup_logging()


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None]:

    # ---App startup---
    logger.info("Starting up the application...")

    app.state.redis = await init_redis()
    yield
    await close_redis(app.state.redis)
    logger.info("Application shutdown complete.")


def init_app() -> FastAPI:
    app = FastAPI(
        title="FastAPI",
        version="0.1.0",
        lifespan=lifespan,
    )

    init_errors_handler(app)
    app.include_router(app_v1)

    return app


app = init_app()


@app.get("/hello")
async def say() -> dict[str, str]:
    logger.info("Received request to /hello endpoint")
    return {"say": "hello"}
