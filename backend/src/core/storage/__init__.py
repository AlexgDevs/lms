"""Object storage infrastructure.

Mirrors the ``core/redis`` pattern: a ``Storage`` abstraction (Protocol) with
pluggable backends selected via ``STORAGE_BACKEND`` env var. No business logic.
"""

from loguru import logger

from src.core.config import settings
from src.core.storage.errors import (
    StorageError,
    StorageObjectNotFoundError,
)
from src.core.storage.factory import build_storage
from src.core.storage.local import LocalStorage
from src.core.storage.protocol import Storage, StorageObjectMeta
from src.core.storage.s3 import S3Storage


async def init_storage() -> Storage:
    """Build the storage backend configured via env. Local backend creates its
    root directory; the S3 backend ensures the bucket exists."""
    storage = build_storage()
    if settings.storage.STORAGE_BACKEND == "s3":
        if not isinstance(storage, S3Storage):
            raise StorageError(
                "S3 backend selected but storage is not an S3Storage instance"
            )
        await storage.ensure_bucket()
    logger.info("Initialized storage backend: {}", settings.storage.STORAGE_BACKEND)
    return storage


async def close_storage(storage: Storage) -> None:
    """Release storage resources. Backends are stateless per-operation."""
    logger.info("Closing storage backend: {}", settings.storage.STORAGE_BACKEND)


__all__ = [
    "init_storage",
    "close_storage",
    "Storage",
    "StorageObjectMeta",
    "StorageError",
    "StorageObjectNotFoundError",
    "LocalStorage",
    "S3Storage",
]
