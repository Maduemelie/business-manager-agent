import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, field_validator
from typing import List, Optional

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
ENV_FILE = os.path.join(BASE_DIR, ".env")

class Settings(BaseSettings):
    # API Credentials
    gemini_api_key: Optional[str] = Field(None, validation_alias="GEMINI_API_KEY")
    groq_api_key: Optional[str] = Field(None, validation_alias="GROQ_API_KEY")
    hf_token: Optional[str] = Field(None, validation_alias="HF_TOKEN")
    ollama_api_key: Optional[str] = Field(None, validation_alias="OLLAMA_API_KEY")
    ollama_base_url: Optional[str] = Field(None, validation_alias="OLLAMA_BASE_URL")
    ollama_model: Optional[str] = Field(None, validation_alias="OLLAMA_MODEL")

    # LLM Settings
    llm_provider: str = Field("gemini", validation_alias="LLM_PROVIDER")
    gemini_model: str = Field("gemini-2.5-flash", validation_alias="GEMINI_MODEL")

    # Paths (Default resolved relative to repo root)
    db_path: str = Field(os.path.join(BASE_DIR, "perfumes.db"), validation_alias="DB_PATH")
    database_url: Optional[str] = Field(None, validation_alias="DATABASE_URL")
    images_dir: str = Field(os.path.join(BASE_DIR, "Sirvinistyles perfume images"), validation_alias="IMAGES_DIR")
    output_dir: str = Field(os.path.join(BASE_DIR, "Ready_To_Post"), validation_alias="OUTPUT_DIR")

    # API Security & CORS
    api_secret_key: str = Field("super-secret-key", validation_alias="API_SECRET_KEY")
    allowed_origins_raw: str = Field(
        "http://localhost:5173,http://localhost:3000",
        validation_alias="ALLOWED_ORIGINS"
    )

    # Logging & Caching Defaults
    log_level: str = Field("INFO", validation_alias="LOG_LEVEL")
    weather_cache_ttl: int = Field(300, validation_alias="WEATHER_CACHE_TTL")

    @property
    def db_url(self) -> str:
        """Resolves active DB URL, fallback mapping db_path to a local sqlite:/// connection."""
        if self.database_url:
            return self.database_url
        normalized_path = os.path.abspath(self.db_path).replace("\\", "/")
        # Ensure correct prefixing
        return f"sqlite:///{normalized_path}"

    model_config = SettingsConfigDict(
        env_file=ENV_FILE,
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @property
    def allowed_origins(self) -> List[str]:
        """Parses the allowed origins raw string into a list of cleaned origins."""
        v = self.allowed_origins_raw.strip()
        # Remove surrounding literal quotes if loaded from env as raw string
        if (v.startswith('"') and v.endswith('"')) or (v.startswith("'") and v.endswith("'")):
            v = v[1:-1]
        return [origin.strip() for origin in v.split(",") if origin.strip()]

    @field_validator("llm_provider")
    @classmethod
    def validate_llm_provider(cls, v):
        choices = ["gemini", "groq", "ollama"]
        if v.lower() not in choices:
            raise ValueError(f"llm_provider must be one of {choices}")
        return v.lower()

settings = Settings()
