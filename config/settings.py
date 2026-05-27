from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_HOST: str = "0.0.0.0"
    APP_PORT: int = 8000
    DEBUG: bool = False
    LOG_LEVEL: str = "INFO"

    DATABASE_URL: str
    DB_POOL_MIN: int = 5
    DB_POOL_MAX: int = 20

    UPSTASH_REDIS_REST_URL: str = ""
    UPSTASH_REDIS_REST_TOKEN :str = ""

    RATE_LIMIT_BUCKET_MAX: int = 100000
    RATE_LIMIT_WINDOW_SECONDS: int = 18000

    CACHE_TTL_SECONDS: int = 600
    CACHE_MAX_TEMPERATURE: float = 0.3

    CIRCUIT_FAILURE_THRESHOLD: int = 5
    CIRCUIT_RESET_TTL_SECONDS: int = 300

    ENABLED_PROVIDERS: list[str] = [
        "groq",
        "openrouter",
        "nvidia"
    ]

    GROQ_API_KEY: str = ""
    OPENROUTER_API_KEY: str = ""
    NVIDIA_API_KEY: str = ""

    PROVIDER_TIMEOUT_DEFAULT: float = 30.0
    GROQ_TIMEOUT: float = 15.0
    OPENROUTER_TIMEOUT: float = 30.0
    NVIDIA_TIMEOUT: float = 45.0

    MAX_PAYLOAD_BYTES: int = 1048576
    MAX_MESSAGES: int = 50
    MAX_SINGLE_MESSAGE_CHARS: int = 50000
    MAX_MAX_TOKENS: int = 8192

    SUPABASE_URL: str = ""
    SUPABASE_ANON_KEY: str = ""
    SUPABASE_JWT_SECRET: str = ""

    DASHBOARD_URL: str = ""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=True,
    )


settings = Settings()