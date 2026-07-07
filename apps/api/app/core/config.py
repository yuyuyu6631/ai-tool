import json
import os
from pathlib import Path
from typing import Annotated

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict


_CONFIG_PATH = Path(__file__).resolve()
ROOT_DIR = _CONFIG_PATH.parents[min(4, len(_CONFIG_PATH.parents) - 1)]


class Settings(BaseSettings):
    app_name: str = "Xingdianping API"
    api_prefix: str = "/api"
    environment: str = "development"
    database_url: str = "sqlite+pysqlite:///:memory:"
    redis_url: str = "redis://localhost:6379/0"
    auth_secret_key: str = "dev-auth-secret-key"
    session_cookie_name: str = "xingdianping_session"
    session_ttl_seconds: int = 604800
    cookie_secure: bool = False
    cookie_samesite: str = "lax"
    admin_seed_enabled: bool = False
    admin_seed_username: str = "admin"
    admin_seed_password: str = ""
    admin_seed_email: str = "admin@xingdianping.local"
    cors_allowed_origins: Annotated[list[str], NoDecode] = Field(
        default_factory=lambda: ["http://localhost:3000", "http://127.0.0.1:3000"]
    )
    cors_allowed_origin_regex: str | None = r"https?://(localhost|127\.0\.0\.1)(:\d+)?$"
    cors_allow_credentials: bool = True
    log_level: str = "INFO"
    ai_provider: str = "stub"
    ai_api_key: str = ""
    ai_model: str = ""
    ai_openai_base_url: str = ""
    ai_anthropic_base_url: str = ""
    embedding_provider: str = ""
    embedding_api_key: str = ""
    embedding_model: str = ""
    embedding_openai_base_url: str = ""
    embedding_recall_top_k: int = 12
    embedding_recall_min_similarity: float = 0.2
    search_provider: str = "legacy"
    meilisearch_url: str = ""
    meilisearch_api_key: str = ""
    meilisearch_index: str = "tools"
    recommendation_ttl_seconds: int = 1800
    recommendation_result_limit: int = 3
    ai_search_candidate_limit: int = 240
    ai_search_intent_timeout_seconds: float = 0.45
    ai_search_intent_failure_cooldown_seconds: float = 30.0

    model_config = SettingsConfigDict(env_file=ROOT_DIR / ".env", extra="ignore")

    @field_validator("database_url", mode="before")
    @classmethod
    def normalize_sqlite_url(cls, value: str) -> str:
        prefix = "sqlite:///./"
        if isinstance(value, str) and value.startswith(prefix):
            return f"sqlite:///{(ROOT_DIR / value.removeprefix(prefix)).as_posix()}"
        return value

    @field_validator("cors_allowed_origins", mode="before")
    @classmethod
    def normalize_cors_origins(cls, value: str | list[str]) -> list[str]:
        if isinstance(value, list):
            return [item.strip() for item in value if isinstance(item, str) and item.strip()]

        if not isinstance(value, str):
            return value

        stripped = value.strip()
        if not stripped:
            return []

        if stripped.startswith("["):
            try:
                parsed = json.loads(stripped)
            except json.JSONDecodeError:
                parsed = None
            if isinstance(parsed, list):
                return [item.strip() for item in parsed if isinstance(item, str) and item.strip()]

        return [item.strip() for item in stripped.split(",") if item.strip()]

    @field_validator("cors_allowed_origin_regex", mode="before")
    @classmethod
    def normalize_origin_regex(cls, value: str | None) -> str | None:
        if isinstance(value, str):
            stripped = value.strip()
            return stripped or None
        return value

    @field_validator("cookie_samesite", mode="before")
    @classmethod
    def normalize_cookie_samesite(cls, value: str) -> str:
        normalized = value.strip().lower() if isinstance(value, str) else "lax"
        if normalized not in {"lax", "strict", "none"}:
            raise ValueError("COOKIE_SAMESITE must be one of: lax, strict, none")
        return normalized

    @field_validator("log_level", mode="before")
    @classmethod
    def normalize_log_level(cls, value: str) -> str:
        normalized = value.strip().upper() if isinstance(value, str) else "INFO"
        if normalized not in {"CRITICAL", "ERROR", "WARNING", "INFO", "DEBUG"}:
            raise ValueError("LOG_LEVEL must be one of: CRITICAL, ERROR, WARNING, INFO, DEBUG")
        return normalized

    @field_validator("environment", mode="before")
    @classmethod
    def normalize_environment(cls, value: str) -> str:
        normalized = value.strip().lower() if isinstance(value, str) else "development"
        aliases = {
            "dev": "development",
            "prod": "production",
        }
        return aliases.get(normalized, normalized)

    @property
    def is_railway(self) -> bool:
        return bool(
            os.getenv("RAILWAY_ENVIRONMENT")
            or os.getenv("RAILWAY_PROJECT_ID")
            or os.getenv("RAILWAY_SERVICE_ID")
        )

    @property
    def is_production_like(self) -> bool:
        return self.environment in {"production", "staging"} or self.is_railway

    @property
    def is_in_memory_sqlite(self) -> bool:
        normalized = self.database_url.replace("+pysqlite", "")
        return normalized.startswith("sqlite:///:memory:")

    @property
    def is_sqlite(self) -> bool:
        return self.database_url.startswith("sqlite")

    @property
    def uses_persistent_database(self) -> bool:
        if self.is_in_memory_sqlite:
            return False
        if self.is_sqlite:
            return self.database_url.startswith("sqlite:///")
        return bool(self.database_url.strip())


settings = Settings()
