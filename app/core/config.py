from functools import lru_cache
from typing import Literal

from pydantic import Field, SecretStr, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

_DEFAULT_JWT_SECRET = "change-this-secret-before-production"


class Settings(BaseSettings):
    app_name: str = "UniMate AI API"
    app_version: str = "0.1.0"
    environment: str = "development"
    api_v1_prefix: str = "/api/v1"

    database_url: str = "sqlite+pysqlite:///./unimate.db"

    jwt_secret_key: str = Field(
        default=_DEFAULT_JWT_SECRET,
        min_length=32,
    )
    jwt_algorithm: Literal["HS256", "HS384", "HS512"] = "HS256"
    access_token_expire_minutes: int = Field(
        default=60,
        gt=0,
        le=10_080,
    )

    cors_origins: str = (
        "http://localhost:5173,"
        "http://127.0.0.1:5173"
    )

    max_upload_size_mb: int = Field(
        default=10,
        gt=0,
        le=50,
    )
    allowed_cv_extensions: str = "pdf,docx,txt"

    # OCR yapılandırması
    tesseract_cmd: str | None = None
    poppler_path: str | None = None
    ocr_language: str = Field(
        default="tur",
        min_length=3,
        max_length=20,
    )
    ocr_dpi: int = Field(
        default=300,
        ge=150,
        le=600,
    )

    # LLM yapılandırması
    llm_provider: Literal["local", "gemini"] = "local"
    gemini_api_key: SecretStr | None = Field(
        default=None,
        repr=False,
    )
    gemini_model: str = "gemini-3.6-flash"
    llm_timeout_seconds: int = Field(
        default=30,
        ge=5,
        le=120,
    )
    llm_max_input_chars: int = Field(
        default=50_000,
        ge=1_000,
        le=200_000,
    )

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    @property
    def cors_origin_list(self) -> list[str]:
        return [
            origin.strip()
            for origin in self.cors_origins.split(",")
            if origin.strip()
        ]

    @property
    def allowed_cv_extension_set(self) -> set[str]:
        return {
            item.strip().lower().lstrip(".")
            for item in self.allowed_cv_extensions.split(",")
            if item.strip()
        }

    @model_validator(mode="after")
    def validate_security_and_llm_settings(self) -> "Settings":
        is_production = self.environment.lower() in {
            "production",
            "prod",
        }

        if is_production and self.jwt_secret_key == _DEFAULT_JWT_SECRET:
            raise ValueError(
                "Production ortamında varsayılan "
                "JWT_SECRET_KEY kullanılamaz."
            )

        if self.llm_provider == "gemini" and self.gemini_api_key is None:
            raise ValueError(
                "LLM_PROVIDER=gemini kullanıldığında "
                "GEMINI_API_KEY tanımlanmalıdır."
            )

        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()