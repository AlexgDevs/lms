from contextlib import asynccontextmanager

from fastapi import FastAPI


@asynccontextmanager
async def lifespan(app: FastAPI):
    # TODO: add redis conncetion
    yield


app = FastAPI(
    title="FastAPI",
    version="0.1.0",
    lifespan=lifespan,
)


@app.get('/hello')
async def say():
    return {'say': 'hello'}
