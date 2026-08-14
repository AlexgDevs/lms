from pathlib import Path
from typing import Annotated, Any, Literal

from pydantic import AnyUrl, BeforeValidator, Field, PostgresDsn, computed_field
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict

from src.core.utils import parse_cors

BASE_DIR = Path(__file__).resolve().parent.parent.parent
ENV_FILE_PATH = BASE_DIR / ".env"


def parse_comma_list(value: Any) -> list[str]:
    if isinstance(value, list):
        return [str(i).strip() for i in value if i]
    if isinstance(value, str):
        return [i.strip() for i in value.split(",") if i.strip()]
    raise ValueError(f"Cannot parse comma-separated list from value: {value}")


class PostgresSettings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=ENV_FILE_PATH,
        env_ignore_empty=True,
        extra="ignore",
    )

    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_USER: str = Field(default=...)
    POSTGRES_PASS: str = Field(default=...)
    POSTGRES_DB: str = Field(default=...)

    @computed_field  # type: ignore[prop-decorator]
    @property
    def DATABASE_URL(self) -> PostgresDsn:
        return PostgresDsn.build(
            scheme="postgresql+asyncpg",
            username=self.POSTGRES_USER,
            password=self.POSTGRES_PASS,
            host=self.POSTGRES_HOST,
            port=self.POSTGRES_PORT,
            path=self.POSTGRES_DB,
        )


class AppSettings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=ENV_FILE_PATH,
        env_ignore_empty=True,
        extra="ignore",
    )

    APP_PORT: int = 8000
    APP_NAME: str = "lms"
    APP_ENV: Literal["development", "testing", "production"] = "development"
    API_V1_STR: str = "/api/v1"

    # JWT
    JWT_SECRET_KEY: str = Field(default=...)
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    REFRESH_TOKEN_EXPIRE_SECONDS: int = REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60

    # CORS & Frontend
    FRONTEND_HOST: str = "http://localhost:3000"
    CORS_ORIGINS: Annotated[list[AnyUrl] | str, BeforeValidator(parse_cors)] = []

    @property
    def secure_cookies(self) -> bool:
        return self.APP_ENV == "production"

    @computed_field  # type: ignore[prop-decorator]
    @property
    def ALL_CORS_ORIGINS(self) -> list[str]:
        if isinstance(self.CORS_ORIGINS, str):
            origins = [self.CORS_ORIGINS] if self.CORS_ORIGINS else []
        else:
            origins = [str(origin) for origin in self.CORS_ORIGINS]

        if self.FRONTEND_HOST:
            origins.append(self.FRONTEND_HOST)

        return list({origin.rstrip("/") for origin in origins if origin})


class RedisSettings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=ENV_FILE_PATH,
        env_ignore_empty=True,
        extra="ignore",
    )

    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_USER: str = "default"
    REDIS_PASSWORD: str = Field(default=...)
    REDIS_MAX_CONNECTIONS: int = 50
    REDIS_SOCKET_TIMEOUT: int = 5
    REDIS_SOCKET_CONNECT_TIMEOUT: int = 2
    REDIS_RETRY_ON_TIMEOUT: bool = True

    @computed_field  # type: ignore[prop-decorator]
    @property
    def REDIS_URL(self) -> str:
        return f"redis://{self.REDIS_USER}:{self.REDIS_PASSWORD}@{self.REDIS_HOST}:{self.REDIS_PORT}"


class StorageSettings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=ENV_FILE_PATH,
        env_ignore_empty=True,
        extra="ignore",
    )

    STORAGE_BACKEND: Literal["local", "s3"] = "local"
    STORAGE_BUCKET: str = "lms-media"
    STORAGE_ENDPOINT_URL: str | None = None
    STORAGE_ACCESS_KEY: str | None = None
    STORAGE_SECRET_KEY: str | None = None
    STORAGE_REGION: str = "us-east-1"
    STORAGE_PUBLIC_BASE_URL: str | None = None
    STORAGE_ROOT_DIR: str = "media"

    @property
    def storage_root_path(self) -> Path:
        path = Path(self.STORAGE_ROOT_DIR)
        return path if path.is_absolute() else (BASE_DIR / path).resolve()


class MediaSettings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=ENV_FILE_PATH,
        env_ignore_empty=True,
        extra="ignore",
    )

    MEDIA_MAX_SIZE_MB: int = 20
    MEDIA_ALLOWED_TYPES: Annotated[
        list[str], NoDecode, BeforeValidator(parse_comma_list)
    ] = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif",
        "image/avif",
        "image/svg+xml",
        "video/mp4",
        "video/webm",
        "video/quicktime",
        "audio/mpeg",
        "audio/ogg",
        "audio/wav",
        "application/pdf",
        "text/plain",
        "text/markdown",
    ]


class AIGatewaySettings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=ENV_FILE_PATH,
        env_ignore_empty=True,
        extra="ignore",
    )

    AI_API_KEY: str | None = Field(default=None)
    AI_BASE_URL: str = "https://openai.api.proxyapi.ru/v1"
    AI_MODEL: str = "openai/gpt-4o"


class TgpSettings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=ENV_FILE_PATH,
        env_ignore_empty=True,
        extra="ignore",
    )

    TGP_MIN_MODULES: int = 5
    TGP_QUESTIONS_PER_MODULE_MIN: int = 2
    TGP_QUESTIONS_PER_MODULE_MAX: int = 3
    TGP_QUESTION_REGENERATION_COOLDOWN_HOURS: int = 1
    TGP_GENERATION_LOCK_TTL_SECONDS: int = 900
    # AI gateway client
    TGP_AI_TIMEOUT_SECONDS: float = 60.0
    TGP_AI_MAX_RETRIES: int = 2
    # Retry policy for transient failures (rate limits / network / 5xx)
    TGP_RETRY_MAX_RETRIES: int = 8
    TGP_RATE_LIMIT_DEFAULT_RETRY_SECONDS: int = 30
    TGP_RATE_LIMIT_MAX_RETRY_COUNTDOWN: int = 300
    TGP_NETWORK_RETRY_BACKOFF: int = 10
    TGP_NETWORK_RETRY_BACKOFF_MAX: int = 45


class Settings(BaseSettings):
    postgres: PostgresSettings = Field(default_factory=PostgresSettings)
    app: AppSettings = Field(default_factory=AppSettings)
    redis: RedisSettings = Field(default_factory=RedisSettings)
    storage: StorageSettings = Field(default_factory=StorageSettings)
    media: MediaSettings = Field(default_factory=MediaSettings)
    ai: AIGatewaySettings = Field(default_factory=AIGatewaySettings)
    tgp: TgpSettings = Field(default_factory=TgpSettings)


settings = Settings()
