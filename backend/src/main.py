from contextlib import asynccontextmanager

from fastapi import FastAPI

from src.core.redis import init_redis, close_redis


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.redis = init_redis()
    yield
    await close_redis(app.state.redis)


app = FastAPI(
    title="FastAPI",
    version="0.1.0",
    lifespan=lifespan,
)


@app.get("/hello")
async def say():
    return {"say": "hello"}
