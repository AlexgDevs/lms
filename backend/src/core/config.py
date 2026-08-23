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
    TGP_SUBMIT_COOLDOWN_HOURS: int = 24
    # Floor for the per-course full-regeneration cooldown.
    TGP_GENERATION_COOLDOWN_HOURS: int = 24
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


class AssistantSettings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=ENV_FILE_PATH,
        env_ignore_empty=True,
        extra="ignore",
    )

    # Number of failed attempts on a block that triggers the mascot offer.
    ASSISTANT_ATTEMPT_THRESHOLD: int = 3
    # How long a generated hint ladder stays cached per user x block.
    ASSISTANT_LADDER_TTL_HOURS: int = 24
    # Max assistant calls (hint ladder + free questions) per user x block per day.
    ASSISTANT_DAILY_CALL_LIMIT: int = 10
    # AI gateway client
    ASSISTANT_AI_TIMEOUT_SECONDS: float = 60.0
    ASSISTANT_AI_MAX_RETRIES: int = 2
    # Concurrency guard for ladder generation.
    ASSISTANT_GENERATION_LOCK_TTL_SECONDS: int = 120
    # How many previous user/assistant messages are sent on a free question.
    ASSISTANT_MAX_HISTORY_MESSAGES: int = 6
    # Number of scaffolding levels in the hint ladder (level 0..N-1).
    ASSISTANT_LEVELS_COUNT: int = 5


class CourseReviewSettings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=ENV_FILE_PATH,
        env_ignore_empty=True,
        extra="ignore",
    )

    # Minimum content required for a course to be sent for review.
    COURSE_REVIEW_MIN_MODULES: int = 1
    COURSE_REVIEW_MIN_LESSONS: int = 1
    COURSE_REVIEW_MIN_BLOCKS: int = 3
    # AI gateway client for the review task.
    COURSE_REVIEW_AI_TIMEOUT_SECONDS: float = 60.0
    COURSE_REVIEW_AI_MAX_RETRIES: int = 2
    # Concurrency guard (one review per course at a time).
    COURSE_REVIEW_LOCK_TTL_SECONDS: int = 600
    # Retry policy for transient failures (rate limits / network / 5xx).
    COURSE_REVIEW_RETRY_MAX_RETRIES: int = 5
    COURSE_REVIEW_RATE_LIMIT_DEFAULT_RETRY_SECONDS: int = 30
    COURSE_REVIEW_RATE_LIMIT_MAX_RETRY_COUNTDOWN: int = 300
    COURSE_REVIEW_NETWORK_RETRY_BACKOFF: int = 10
    COURSE_REVIEW_NETWORK_RETRY_BACKOFF_MAX: int = 45
    # Total amount of course content text sent to the AI reviewer.
    COURSE_REVIEW_MAX_TEXT_CHARS: int = 6000


class CodeExecSettings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=ENV_FILE_PATH,
        env_ignore_empty=True,
        extra="ignore",
    )

    CODEEXEC_BASE_URL: str = "http://localhost:2000"
    CODEEXEC_TIMEOUT_SECONDS: float = 10.0
    CODEEXEC_MAX_TEST_CASES: int = 10
    CODEEXEC_PER_CASE_RUN_TIMEOUT_MS: int = 2000
    CODEEXEC_COMPILE_TIMEOUT_MS: int = 2000
    CODEEXEC_MEMORY_LIMIT_MB: int = 128
    CODEEXEC_MAX_CODE_CHARS: int = 64_000


class CourseGenerateSettings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=ENV_FILE_PATH,
        env_ignore_empty=True,
        extra="ignore",
    )

    COURSE_GENERATE_MODULES_MIN: int = 1
    COURSE_GENERATE_MODULES_MAX: int = 3
    COURSE_GENERATE_LESSONS_MIN: int = 1
    COURSE_GENERATE_LESSONS_MAX: int = 5
    COURSE_GENERATE_BLOCKS_MIN: int = 1
    COURSE_GENERATE_BLOCKS_MAX: int = 6
    COURSE_GENERATE_AI_TIMEOUT_SECONDS: float = 90.0
    COURSE_GENERATE_AI_MAX_RETRIES: int = 3
    COURSE_GENERATE_LOCK_TTL_SECONDS: int = 600
    COURSE_GENERATE_RATE_LIMIT_DEFAULT_RETRY_SECONDS: int = 30
    COURSE_GENERATE_RATE_LIMIT_MAX_RETRY_COUNTDOWN: int = 300
    COURSE_GENERATE_NETWORK_RETRY_BACKOFF: int = 10
    COURSE_GENERATE_NETWORK_RETRY_BACKOFF_MAX: int = 45
    COURSE_GENERATE_MAX_RETRIES: int = 5


class Settings(BaseSettings):
    postgres: PostgresSettings = Field(default_factory=PostgresSettings)
    app: AppSettings = Field(default_factory=AppSettings)
    redis: RedisSettings = Field(default_factory=RedisSettings)
    storage: StorageSettings = Field(default_factory=StorageSettings)
    media: MediaSettings = Field(default_factory=MediaSettings)
    ai: AIGatewaySettings = Field(default_factory=AIGatewaySettings)
    tgp: TgpSettings = Field(default_factory=TgpSettings)
    assistant: AssistantSettings = Field(default_factory=AssistantSettings)
    course_review: CourseReviewSettings = Field(default_factory=CourseReviewSettings)
    course_generate: CourseGenerateSettings = Field(
        default_factory=CourseGenerateSettings
    )
    codeexec: CodeExecSettings = Field(default_factory=CodeExecSettings)


settings = Settings()
