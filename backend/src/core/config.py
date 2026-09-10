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
    # Per-user cap on CODE submissions per minute (cheap-DoS guard on Piston).
    CODEEXEC_MAX_CALLS_PER_USER_PER_MINUTE: int = 5


class PaymentSettings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=ENV_FILE_PATH,
        env_ignore_empty=True,
        extra="ignore",
    )

    YOOKASSA_SHOP_ID: str = Field(default="")
    YOOKASSA_SECRET_KEY: str = Field(default="")
    YOOKASSA_RETURN_URL: str = Field(default="http://localhost:3000")
    PAYMENTS_SANDBOX: bool = True

    # Provider selection. "mock" lets you exercise the SBP/QR and fallback logic
    # locally without real YooKassa credentials (see src.payment.client.MockYooKassaClient).
    PAYMENT_PROVIDER_MODE: Literal["yookassa", "mock"] = "yookassa"

    # Mock provider knobs (used only when PAYMENT_PROVIDER_MODE == "mock").
    MOCK_SBP_AVAILABLE: bool = True
    MOCK_CONFIRMATION_URL: str = Field(default="http://localhost:5173/mock-payment")
    MOCK_RAISE_NETWORK: bool = False

    # Dev-only escape hatch: allow webhook delivery from localhost when testing
    # locally (real YooKassa webhooks cannot reach a local dev server). It only
    # takes effect when PAYMENT_PROVIDER_MODE == "mock", so a leaked flag in
    # production cannot be abused to enroll a free course from localhost.
    PAYMENT_WEBHOOK_DEV_ACCEPT: bool = False

    # Trusted reverse-proxy / load-balancer IPs (comma-separated). When the
    # immediate socket peer (request.client.host) is one of these, the real
    # client IP is resolved from the X-Forwarded-For chain so the YooKassa IP
    # whitelist keeps working behind nginx/traefik.
    YOOKASSA_TRUSTED_PROXY_IPS: Annotated[
        list[str], NoDecode, BeforeValidator(parse_comma_list)
    ] = []

    # Platform: commission (%) taken from every purchase, and the payout
    # details of the site owner where the platform share goes. During the beta
    # (Founders program) the platform commission is 0% — all money goes to the
    # platform owner for product development.
    PAYMENT_PLATFORM_FEE_PERCENT: float = 0.0
    PAYOUT_PLATFORM_RECIPIENT: str = Field(default="")

    @property
    def mode(self) -> Literal["yookassa", "mock"]:
        return self.PAYMENT_PROVIDER_MODE

    @property
    def enabled(self) -> bool:
        return bool(self.YOOKASSA_SHOP_ID and self.YOOKASSA_SECRET_KEY)


class CourseGenerateSettings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=ENV_FILE_PATH,
        env_ignore_empty=True,
        extra="ignore",
    )

    COURSE_GENERATE_MODULES_MIN: int = 3
    COURSE_GENERATE_MODULES_MAX: int = 10
    COURSE_GENERATE_LESSONS_MIN: int = 3
    COURSE_GENERATE_LESSONS_MAX: int = 10
    COURSE_GENERATE_BLOCKS_MIN: int = 3
    COURSE_GENERATE_BLOCKS_MAX: int = 10
    # Free AI course generations per user before generation is blocked.
    COURSE_GENERATE_FREE_LIMIT: int = 1
    COURSE_GENERATE_AI_TIMEOUT_SECONDS: float = 120.0
    COURSE_GENERATE_AI_MAX_RETRIES: int = 3
    COURSE_GENERATE_LOCK_TTL_SECONDS: int = 900
    COURSE_GENERATE_RATE_LIMIT_DEFAULT_RETRY_SECONDS: int = 30
    COURSE_GENERATE_RATE_LIMIT_MAX_RETRY_COUNTDOWN: int = 300
    COURSE_GENERATE_NETWORK_RETRY_BACKOFF: int = 10
    COURSE_GENERATE_NETWORK_RETRY_BACKOFF_MAX: int = 45
    COURSE_GENERATE_MAX_RETRIES: int = 5


class MailSettings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=ENV_FILE_PATH,
        env_ignore_empty=True,
        extra="ignore",
    )

    SMTP_HOST: str = "localhost"
    SMTP_PORT: int = 1025
    SMTP_USERNAME: str | None = None
    SMTP_PASSWORD: str | None = None
    SMTP_FROM: str = "noreply@lms.local"
    SMTP_FROM_NAME: str = "LMS"
    SMTP_USE_TLS: bool = False
    SMTP_TIMEOUT_SECONDS: float = 10.0
    # When False, emails are only logged (dev), never sent.
    MAIL_ENABLED: bool = True


class RateLimitSettings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=ENV_FILE_PATH,
        env_ignore_empty=True,
        extra="ignore",
    )

    # Global per-IP fixed-window guard for the whole API (DDoS / abuse layer).
    RATE_LIMIT_GLOBAL_ENABLED: bool = True
    RATE_LIMIT_GLOBAL_REQ_PER_MIN: int = 300

    # Login brute-force guard: per username over a sliding window.
    RATE_LIMIT_LOGIN_MAX_TRIES: int = 5
    RATE_LIMIT_LOGIN_WINDOW_SECONDS: int = 900
    # IP-level login guard (DDoS / shared-IP safety): 10× the per-user limit.
    RATE_LIMIT_LOGIN_IP_MAX_TRIES: int = 50

    # Email flood guard (forgot_password / resend_verification): per email
    # address over a window.
    RATE_LIMIT_EMAIL_MAX_REQUESTS: int = 3
    RATE_LIMIT_EMAIL_WINDOW_SECONDS: int = 3600
    # IP-level email guard: 10× the per-email limit.
    RATE_LIMIT_EMAIL_IP_MAX_REQUESTS: int = 30

    # Trusted reverse-proxy / load-balancer IPs (comma-separated). Used by
    # ``core.rate_limit.get_client_ip`` to resolve the real client IP from the
    # ``X-Forwarded-For`` chain so per-IP limits work behind nginx/traefik.
    RATE_LIMIT_TRUSTED_PROXY_IPS: Annotated[
        list[str], NoDecode, BeforeValidator(parse_comma_list)
    ] = []


class FounderSettings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=ENV_FILE_PATH,
        env_ignore_empty=True,
        extra="ignore",
    )

    # "Beta Founders" program. While it is open, any author who publishes a course
    # is granted the lifetime Founder status. The program closes when BOTH the
    # cumulative SUCCEEDED revenue reaches the limit AND the founder quota is filled.
    FOUNDER_PROGRAM_ENABLED: bool = True
    FOUNDER_PROGRAM_REVENUE_LIMIT: int = 50_000
    FOUNDER_PROGRAM_MAX_AUTHORS: int = 30
    # Lifetime commission for Founders after the platform leaves the beta model
    # (not applied to payment splits while FOUNDER_PROGRAM is in beta / fee = 0).
    FOUNDER_COMMISSION_PERCENT: float = 5.0


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
    payments: PaymentSettings = Field(default_factory=PaymentSettings)
    mail: MailSettings = Field(default_factory=MailSettings)
    rate_limit: RateLimitSettings = Field(default_factory=RateLimitSettings)
    founder: FounderSettings = Field(default_factory=FounderSettings)


settings = Settings()
