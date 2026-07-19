from functools import lru_cache
from typing import Literal

from pydantic import Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

_DEFAULT_JWT_SECRET = "change-this-secret-before-production"


class Settings(BaseSettings):
    app_name: str = "UniMate AI API"
    app_version: str = "0.1.0"
    environment: str = "development"
    api_v1_prefix: str = "/api/v1"

    database_url: str = "sqlite+pysqlite:///./unimate.db"

    jwt_secret_key: str = Field(default=_DEFAULT_JWT_SECRET, min_length=32)
    jwt_algorithm: Literal["HS256", "HS384", "HS512"] = "HS256"
    access_token_expire_minutes: int = Field(default=60, gt=0, le=10_080)

    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @model_validator(mode="after")
    def reject_default_secret_in_production(self) -> "Settings":
        if self.environment.lower() in {"production", "prod"} and self.jwt_secret_key == _DEFAULT_JWT_SECRET:
            raise ValueError("Production ortamında varsayılan JWT_SECRET_KEY kullanılamaz.")
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
