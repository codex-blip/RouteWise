"""
Pytest fixtures for backend testing.

Provides:
- async_db_session: Isolated database session for each test
- test_client: HTTP client for API endpoint testing
- db_engine: Test database engine

Usage:
    async def test_create_user(async_db_session):
        user = User(name="Test", email="test@example.com")
        async_db_session.add(user)
        await async_db_session.commit()
"""
import asyncio
from typing import AsyncGenerator

import pytest
import pytest_asyncio
from fastapi.testclient import TestClient
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from app.models import Base, User, Ride
from app.db.base import get_db
from app.main import app

# Test database URL (uses separate test database)
TEST_DATABASE_URL = "postgresql+asyncpg://postgres:123@localhost:5432/uber_clone_test"

# Create test engine
test_engine = create_async_engine(
    TEST_DATABASE_URL,
    echo=False,
    future=True,
)

# Test session factory
TestSessionLocal = sessionmaker(
    test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)

# Override dependency for tests
async def override_get_db() -> AsyncGenerator[AsyncSession, None]:
    async with TestSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()

app.dependency_overrides[get_db] = override_get_db


@pytest_asyncio.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(scope="session", autouse=True)
async def setup_test_database() -> AsyncGenerator[None, None]:
    """
    Create all tables before running tests, drop them after.
    
    This fixture runs once per test session.
    """
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    yield
    
    # Clean up after all tests
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    
    await test_engine.dispose()


@pytest_asyncio.fixture
async def async_db_session() -> AsyncGenerator[AsyncSession, None]:
    """
    Provide an isolated database session for each test.
    
    Automatically rolls back after each test to keep tests isolated.
    """
    async with TestSessionLocal() as session:
        try:
            yield session
        finally:
            # Rollback any uncommitted changes
            await session.rollback()
            # Close the session
            await session.close()


@pytest_asyncio.fixture
async def test_client() -> AsyncGenerator[AsyncClient, None]:
    """
    Provide an HTTP client for testing API endpoints.
    
    Usage:
        async def test_health(test_client):
            response = await test_client.get("/api/v1/health")
            assert response.status_code == 200
    """
    async with AsyncClient(app=app, base_url="http://test") as client:
        yield client


@pytest.fixture
def sample_user_data() -> dict:
    """Return sample user data for testing."""
    return {
        "name": "Test User",
        "email": "test@example.com",
        "phone": "+1-555-0123",
        "role": "rider",
    }


@pytest.fixture
def sample_ride_data() -> dict:
    """Return sample ride request data for testing."""
    return {
        "pickup": {
            "lat": 37.7749,
            "lng": -122.4194,
            "address": "123 Market St, San Francisco, CA",
        },
        "dropoff": {
            "lat": 37.8044,
            "lng": -122.2712,
            "address": "Oakland Downtown, Oakland, CA",
        },
    }
