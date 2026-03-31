from pathlib import Path

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


ROOT_DIR = Path(__file__).resolve().parents[4]


class Settings(BaseSettings):
    app_name: str = "Xingdianping API"
    api_prefix: str = "/api"
    database_url: str = "sqlite+pysqlite:///:memory:"
    redis_url: str = "redis://localhost:6379/0"
    ai_provider: str = "stub"
    ai_api_key: str = ""
    ai_model: str = ""
    ai_openai_base_url: str = ""
    ai_anthropic_base_url: str = ""
    recommendation_ttl_seconds: int = 1800

    model_config = SettingsConfigDict(env_file=ROOT_DIR / ".env", extra="ignore")

    @field_validator("database_url", mode="before")
    @classmethod
    def normalize_sqlite_url(cls, value: str) -> str:
        prefix = "sqlite:///./"
        if isinstance(value, str) and value.startswith(prefix):
            return f"sqlite:///{(ROOT_DIR / value.removeprefix(prefix)).as_posix()}"
        return value


settings = Settings()
