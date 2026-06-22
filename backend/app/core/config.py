"""
Application configuration using Pydantic Settings.
Provides centralized, type-safe access to all environment variables.
"""
from functools import lru_cache
from typing import List, Optional

from pydantic import PostgresDsn, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",  # Allow extra fields for future extensions
    )

    # Application metadata
    app_name: str = "Uber Clone API"
    debug: bool = True
    environment: str = "development"  # development, staging, production

    # Server configuration
    host: str = "0.0.0.0"
    port: int = 8000

    # CORS - Frontend URL for cross-origin requests
    frontend_url: str = "http://localhost:3000"

    # Database - Async PostgreSQL connection string
    database_url: PostgresDsn = "postgresql+asyncpg://postgres:123@localhost:5432/uber_clone"

    # JWT Authentication (Step 4)
    # jwt_secret_key: Optional[str] = None  # TODO: Enable in Step 4
    # jwt_algorithm: str = "HS256"          # TODO: Enable in Step 4
    # access_token_expire_minutes: int = 30 # TODO: Enable in Step 4

    # Mapbox API (server-side geocoding)
    mapbox_api_key: Optional[str] = None  # Server-side Mapbox token for geocoding/directions

    # Stripe (Step 3 - Payments)
    stripe_secret_key: Optional[str] = None
    stripe_webhook_secret: Optional[str] = None

    # Redis (Step 2 - Real-time features)
    # redis_url: Optional[str] = None  # TODO: Enable in Step 2

    @field_validator("environment")
    @classmethod
    def validate_environment(cls, v: str) -> str:
        """Validate environment value."""
        allowed = {"development", "staging", "production"}
        if v not in allowed:
            raise ValueError(f"environment must be one of {allowed}")
        return v

    @property
    def is_development(self) -> bool:
        """Check if running in development mode."""
        return self.environment == "development"

    @property
    def cors_origins(self) -> List[str]:
        """Generate CORS allowed origins list."""
        origins = [self.frontend_url]
        if self.is_development:
            # Allow localhost variations in development
            origins.extend([
                "http://localhost:3000",
                "http://127.0.0.1:3000",
                "http://localhost:3001",
            ])
        return origins


@lru_cache()
def get_settings() -> Settings:
    """
    Get cached Settings instance.
    Uses lru_cache to avoid reloading .env on every access.
    """
    return Settings()
