"""Pytest fixtures ensuring deterministic config for unit tests."""

import os

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import get_settings
from app.core.database import Base
from app.services import llm as llm_service
from app.services import stt as stt_service
from app.services import storage as storage_service

# Force mock providers and local database regardless of developer .env contents.
os.environ.setdefault("DATABASE_URL", "sqlite:///./test.db")
os.environ.setdefault("SECRET_KEY", "test-secret")
os.environ["USE_MOCK_AI"] = "true"
os.environ["LLM_PROVIDER"] = "mock"
os.environ["STT_PROVIDER"] = "mock"
os.environ["STORAGE_PROVIDER"] = "local"
os.environ.setdefault("MEDIA_ROOT", "backend/app/data")
os.environ.setdefault("ALLOWED_ORIGINS", "http://localhost:5173")

# Drop cached settings/provider instances so tests always see the overrides.
get_settings.cache_clear()  # type: ignore[attr-defined]
llm_service._provider_cache = None  # type: ignore[attr-defined]
stt_service._provider_cache = None  # type: ignore[attr-defined]
storage_service.reset_storage_provider()


@pytest.fixture
def db_session():
    """Create a test database session."""
    engine = create_engine("sqlite:///./test.db", connect_args={"check_same_thread": False})
    Base.metadata.create_all(engine)
    SessionLocal = sessionmaker(bind=engine)
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(engine)
