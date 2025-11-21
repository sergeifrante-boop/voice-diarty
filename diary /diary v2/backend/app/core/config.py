from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from typing import List, Literal, Optional

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parents[3]

def _parse_allowed_origins(value: str) -> List[str]:
    return [origin.strip() for origin in value.split(",") if origin.strip()]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=BASE_DIR / ".env", env_file_encoding="utf-8")

    database_url: str = Field(alias="DATABASE_URL")
    allowed_origins_raw: str = Field(
        default="http://localhost:5173",
        alias="ALLOWED_ORIGINS",
        description="Comma-separated list of origins",
    )
    openai_api_key: Optional[str] = Field(default=None, alias="OPENAI_API_KEY")
    stt_api_key: Optional[str] = Field(default=None, alias="STT_API_KEY")
    openai_llm_model: str = Field(default="gpt-4o-mini", alias="OPENAI_LLM_MODEL")
    openai_stt_model: str = Field(default="gpt-4o-mini-transcribe", alias="OPENAI_STT_MODEL")
    secret_key: str = Field(alias="SECRET_KEY")
    access_token_expire_minutes: int = Field(default=60, alias="ACCESS_TOKEN_EXPIRE_MINUTES")
    use_mock_ai: bool = Field(default=True, alias="USE_MOCK_AI")
    llm_provider: Literal["mock", "openai"] = Field(default="mock", alias="LLM_PROVIDER")
    stt_provider: Literal["mock", "openai"] = Field(default="mock", alias="STT_PROVIDER")
    storage_provider: Literal["local", "s3"] = Field(default="local", alias="STORAGE_PROVIDER")
    media_root: Path = Field(default=BASE_DIR / "backend" / "app" / "data", alias="MEDIA_ROOT")
    media_base_url: str = Field(default="/media", alias="MEDIA_BASE_URL")
    storage_bucket: Optional[str] = Field(default=None, alias="STORAGE_BUCKET")
    transcript_formatting_enabled: bool = Field(default=True, alias="TRANSCRIPT_FORMATTING_ENABLED")

    @classmethod
    def settings_customise_sources(cls, settings_cls, init_settings, env_settings, dotenv_settings, file_secret_settings):  # type: ignore[override]
        return (init_settings, env_settings, dotenv_settings, file_secret_settings)

    def model_post_init(self, __context):  # type: ignore[override]
        if not self.use_mock_ai:
            if self.llm_provider == "mock":
                object.__setattr__(self, "llm_provider", "openai")
            if self.stt_provider == "mock":
                object.__setattr__(self, "stt_provider", "openai")
        self._validate_ai_configuration()

    @property
    def allowed_origins(self) -> List[str]:
        return _parse_allowed_origins(self.allowed_origins_raw)

    def _validate_ai_configuration(self) -> None:
        if self.llm_provider != "mock" and not self.openai_api_key:
            raise ValueError("OPENAI_API_KEY is required when LLM_PROVIDER is not 'mock'")
        if self.stt_provider != "mock" and not self.stt_api_key and not self.openai_api_key:
            raise ValueError("STT_API_KEY or OPENAI_API_KEY required when STT_PROVIDER is not 'mock'")


@lru_cache
def get_settings() -> Settings:
    return Settings()
