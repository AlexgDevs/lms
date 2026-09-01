import asyncio
import mimetypes
from datetime import datetime, timezone
from pathlib import Path
from typing import Mapping

from src.core.storage.errors import StorageObjectNotFoundError
from src.core.storage.protocol import Storage, StorageObjectMeta


class LocalStorage:
    """Filesystem-backed storage for local development and tests."""

    def __init__(
        self,
        root_dir: str | Path,
        base_url: str = "/media",
    ) -> None:
        self.root_dir = Path(root_dir).resolve()
        self.base_url = base_url.rstrip("/")
        self.root_dir.mkdir(parents=True, exist_ok=True)

    def _resolve_path(self, key: str) -> Path:
        path = (self.root_dir / key).resolve()
        if not path.is_relative_to(self.root_dir):
            raise ValueError(f"Storage key escapes the storage root: {key}")
        return path

    async def upload_bytes(
        self,
        key: str,
        data: bytes,
        content_type: str,
        metadata: Mapping[str, str] | None = None,
    ) -> None:
        path = self._resolve_path(key)
        path.parent.mkdir(parents=True, exist_ok=True)

        def _write() -> None:
            with path.open("wb") as file:
                file.write(data)

        await asyncio.to_thread(_write)

    async def download_bytes(self, key: str) -> bytes:
        path = self._resolve_path(key)
        if not path.is_file():
            raise StorageObjectNotFoundError
        return await asyncio.to_thread(path.read_bytes)

    async def delete(self, key: str) -> None:
        path = self._resolve_path(key)
        await asyncio.to_thread(path.unlink, missing_ok=True)

    async def exists(self, key: str) -> bool:
        path = self._resolve_path(key)
        return await asyncio.to_thread(path.is_file)

    async def get_metadata(self, key: str) -> StorageObjectMeta | None:
        path = self._resolve_path(key)
        if not path.is_file():
            return None

        stat = await asyncio.to_thread(path.stat)
        content_type, _ = mimetypes.guess_type(key)
        return StorageObjectMeta(
            content_type=content_type,
            size=stat.st_size,
            etag=None,
            last_modified=datetime.fromtimestamp(stat.st_mtime, tz=timezone.utc),
        )

    async def get_presigned_url(self, key: str, expires_in: int = 900) -> str:
        return self.get_public_url(key)

    def get_public_url(self, key: str) -> str:
        return f"{self.base_url}/{key}"
