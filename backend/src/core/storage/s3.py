from datetime import datetime
from typing import Any, Mapping

import aioboto3
from botocore.exceptions import ClientError

from src.core.storage.errors import StorageError, StorageObjectNotFoundError
from src.core.storage.protocol import Storage, StorageObjectMeta


def _to_datetime(value: Any) -> datetime | None:
    if isinstance(value, datetime):
        return value
    return None


class S3Storage:
    """S3-compatible object storage (AWS S3, MinIO, Cloudflare R2, Yandex Object Storage)."""

    def __init__(
        self,
        bucket: str,
        *,
        access_key: str | None,
        secret_key: str | None,
        region: str,
        endpoint_url: str | None,
        public_base_url: str | None,
    ) -> None:
        self.bucket = bucket
        self.endpoint_url = endpoint_url
        self.public_base_url = public_base_url
        self._session: Any = aioboto3.Session(
            aws_access_key_id=access_key,
            aws_secret_access_key=secret_key,
            region_name=region,
        )

    @staticmethod
    def _is_not_found(exc: ClientError) -> bool:
        status: Any = exc.response.get("ResponseMetadata", {}).get("HTTPStatusCode")
        return bool(status == 404)

    async def upload_bytes(
        self,
        key: str,
        data: bytes,
        content_type: str,
        metadata: Mapping[str, str] | None = None,
    ) -> None:
        async with self._session.client("s3", endpoint_url=self.endpoint_url) as client:
            await client.put_object(
                Bucket=self.bucket,
                Key=key,
                Body=data,
                ContentType=content_type,
                Metadata=dict(metadata) if metadata else None,
            )

    async def download_bytes(self, key: str) -> bytes:
        async with self._session.client("s3", endpoint_url=self.endpoint_url) as client:
            response: Any = await client.get_object(Bucket=self.bucket, Key=key)
            body: Any = response["Body"]
            data: bytes = await body.read()
        return data

    async def delete(self, key: str) -> None:
        async with self._session.client("s3", endpoint_url=self.endpoint_url) as client:
            await client.delete_object(Bucket=self.bucket, Key=key)

    async def exists(self, key: str) -> bool:
        try:
            async with self._session.client(
                "s3", endpoint_url=self.endpoint_url
            ) as client:
                await client.head_object(Bucket=self.bucket, Key=key)
        except ClientError as exc:
            if self._is_not_found(exc):
                return False
            raise StorageError from exc
        return True

    async def get_metadata(self, key: str) -> StorageObjectMeta | None:
        try:
            async with self._session.client(
                "s3", endpoint_url=self.endpoint_url
            ) as client:
                head: Any = await client.head_object(Bucket=self.bucket, Key=key)
        except ClientError as exc:
            if self._is_not_found(exc):
                return None
            raise StorageError from exc

        return StorageObjectMeta(
            content_type=head.get("ContentType"),
            size=head.get("ContentLength", 0),
            etag=head.get("ETag"),
            last_modified=_to_datetime(head.get("LastModified")),
        )

    async def get_presigned_url(self, key: str, expires_in: int = 900) -> str | None:
        async with self._session.client("s3", endpoint_url=self.endpoint_url) as client:
            url: str = await client.generate_presigned_url(
                ClientMethod="get_object",
                Params={"Bucket": self.bucket, "Key": key},
                ExpiresIn=expires_in,
            )
        return url

    def get_public_url(self, key: str) -> str:
        base = (self.public_base_url or "").rstrip("/")
        if base:
            return f"{base}/{key}"
        endpoint = (self.endpoint_url or "").rstrip("/")
        if endpoint:
            return f"{endpoint}/{self.bucket}/{key}"
        return key
