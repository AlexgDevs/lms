from contextlib import asynccontextmanager

from fastapi import FastAPI
from loguru import logger

from src.core.redis import init_redis, close_redis
from src.core.logging import setup_logging

setup_logging()


@asynccontextmanager
async def lifespan(app: FastAPI):

    # ---App startup---
    logger.info("Starting up the application...")

    app.state.redis = await init_redis()
    yield
    await close_redis(app.state.redis)
    logger.info("Application shutdown complete.")


app = FastAPI(
    title="FastAPI",
    version="0.1.0",
    lifespan=lifespan,
)


@app.get("/hello")
async def say():
    logger.info("Received request to /hello endpoint")
    return {"say": "hello"}
