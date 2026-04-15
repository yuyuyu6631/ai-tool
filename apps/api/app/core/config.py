from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

from app.core.paths import WORKSPACE_ROOT


class Settings(BaseSettings):
    app_name: str = "Xingdianping API"
    api_prefix: str = "/api"
    database_url: str = "sqlite+pysqlite:///:memory:"
    redis_url: str = "redis://localhost:6379/0"
    cache_enabled: bool = True
    cors_allowed_origins: list[str] = Field(
        default_factory=lambda: ["http://localhost:3000", "http://127.0.0.1:3000"]
    )
    auth_secret_key: str = "dev-auth-secret-key"
    session_cookie_name: str = "xingdianping_session"
    session_ttl_seconds: int = 604800
    cookie_secure: bool = False
    cookie_samesite: str = "lax"
    cookie_domain: str | None = None
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
    recommendation_ttl_seconds: int = 1800
    catalog_bootstrap_mode: str = "off"

    model_config = SettingsConfigDict(env_file=WORKSPACE_ROOT / ".env", extra="ignore")

    @field_validator("database_url", mode="before")
    @classmethod
    def normalize_sqlite_url(cls, value: str) -> str:
        prefix = "sqlite:///./"
        if isinstance(value, str) and value.startswith(prefix):
            return f"sqlite:///{(WORKSPACE_ROOT / value.removeprefix(prefix)).as_posix()}"
        return value

    @field_validator("cors_allowed_origins", mode="before")
    @classmethod
    def normalize_cors_allowed_origins(cls, value: object) -> list[str]:
        if value is None:
            return []
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        if isinstance(value, (list, tuple, set)):
            return [str(origin).strip() for origin in value if str(origin).strip()]
        raise TypeError("cors_allowed_origins must be a comma-separated string or a list of origins")

    @field_validator("cookie_samesite", mode="before")
    @classmethod
    def normalize_cookie_samesite(cls, value: object) -> str:
        normalized = str(value or "lax").strip().lower()
        if normalized not in {"lax", "strict", "none"}:
            raise ValueError("cookie_samesite must be one of: lax, strict, none")
        return normalized

    @field_validator("catalog_bootstrap_mode", mode="before")
    @classmethod
    def normalize_catalog_bootstrap_mode(cls, value: object) -> str:
        normalized = str(value or "off").strip().lower()
        if normalized not in {"off", "seed", "import-all"}:
            raise ValueError("catalog_bootstrap_mode must be one of: off, seed, import-all")
        return normalized


settings = Settings()
