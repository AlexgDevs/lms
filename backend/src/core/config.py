from pathlib import Path
from typing import Annotated, Literal

from pydantic import AnyUrl, BeforeValidator, Field, PostgresDsn, computed_field
from pydantic_settings import BaseSettings, SettingsConfigDict

from src.core.utils import parse_cors

BASE_DIR = Path(__file__).resolve().parent.parent.parent
ENV_FILE_PATH = BASE_DIR / ".env"


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


class Settings(BaseSettings):
    postgres: PostgresSettings = Field(default_factory=PostgresSettings)
    app: AppSettings = Field(default_factory=AppSettings)
    redis: RedisSettings = Field(default_factory=RedisSettings)


settings = Settings()
