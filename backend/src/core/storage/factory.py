from typing import Callable

from src.core.config import settings
from src.core.storage.errors import StorageError
from src.core.storage.local import LocalStorage
from src.core.storage.protocol import Storage

StorageBuilder = Callable[[], Storage]

_REGISTRY: dict[str, StorageBuilder] = {}


def register_storage(name: str) -> Callable[[StorageBuilder], StorageBuilder]:
    def decorator(builder: StorageBuilder) -> StorageBuilder:
        _REGISTRY[name] = builder
        return builder

    return decorator


def build_storage() -> Storage:
    backend = settings.storage.STORAGE_BACKEND
    builder = _REGISTRY.get(backend)
    if builder is None:
        raise StorageError(f"Unknown storage backend: {backend}")
    return builder()


@register_storage("local")
def _build_local_storage() -> Storage:
    storage = settings.storage
    return LocalStorage(
        root_dir=storage.storage_root_path,
        base_url=storage.STORAGE_PUBLIC_BASE_URL or "/media",
    )


@register_storage("s3")
def _build_s3_storage() -> Storage:
    from src.core.storage.s3 import S3Storage

    storage = settings.storage
    return S3Storage(
        bucket=storage.STORAGE_BUCKET,
        access_key=storage.STORAGE_ACCESS_KEY,
        secret_key=storage.STORAGE_SECRET_KEY,
        region=storage.STORAGE_REGION,
        endpoint_url=storage.STORAGE_ENDPOINT_URL,
        public_base_url=storage.STORAGE_PUBLIC_BASE_URL,
    )
