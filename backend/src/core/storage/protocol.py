from dataclasses import dataclass
from datetime import datetime
from typing import Mapping, Protocol, runtime_checkable


@dataclass
class StorageObjectMeta:
    content_type: str | None
    size: int
    etag: str | None
    last_modified: datetime | None


@runtime_checkable
class Storage(Protocol):
    """Object storage abstraction.

    Contract:
    - ``upload_bytes`` stores the whole object (overwrites if the key exists).
    - ``download_bytes`` raises ``StorageObjectNotFoundError`` when the key is missing.
    - ``exists`` / ``get_metadata`` return ``None`` for missing keys instead of raising.
    - Keys are opaque to the storage layer; building business keys is the
      caller's responsibility.
    """

    async def upload_bytes(
        self,
        key: str,
        data: bytes,
        content_type: str,
        metadata: Mapping[str, str] | None = None,
    ) -> None: ...

    async def download_bytes(self, key: str) -> bytes: ...

    async def delete(self, key: str) -> None: ...

    async def exists(self, key: str) -> bool: ...

    async def get_metadata(self, key: str) -> StorageObjectMeta | None: ...

    async def get_presigned_url(
        self, key: str, expires_in: int = 900
    ) -> str | None: ...

    def get_public_url(self, key: str) -> str: ...
