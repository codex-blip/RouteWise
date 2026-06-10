"""
SQLAlchemy Base model and session management.

This module provides:
- Base: The declarative base for all SQLAlchemy models
- async_engine: Async database engine
- AsyncSessionLocal: Factory for creating async database sessions
- get_db: Dependency for FastAPI route handlers

TODO Step 2: Add PostGIS spatial extensions here when implementing geo queries:
    from geoalchemy2 import Geometry
    # Add spatial columns to models: location = Column(Geometry('POINT', srid=4326))
"""
from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase

from app.core.config import get_settings
from app.core.logging import get_logger

logger = get_logger(__name__)

# Get database URL from settings
settings = get_settings()
DATABASE_URL = str(settings.database_url)


class Base(DeclarativeBase):
    """
    Base class for all SQLAlchemy models.

    All models should inherit from this class.
    Provides common functionality like automatic table naming.
    """

    # Enable hybrid properties for computed columns
    __abstract__ = True

    # Auto-generate table name from class name if not explicitly set
    @classmethod
    def __tablename__(cls) -> str:
        """Generate table name automatically from class name."""
        return cls.__name__.lower() + "s"


# Create async database engine
# echo=True logs all SQL statements in development (useful for debugging)
async_engine = create_async_engine(
    DATABASE_URL,
    echo=settings.debug,  # Log SQL queries in debug mode
    future=True,          # Use SQLAlchemy 2.0 style
    pool_pre_ping=True,   # Verify connections before using from pool
    pool_size=10,         # Default connection pool size
    max_overflow=20,      # Max additional connections when pool is full
)

# Create async session factory
# expire_on_commit=False keeps objects usable after session commit
AsyncSessionLocal = async_sessionmaker(
    async_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,      # Manual flush control for better performance
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    FastAPI dependency that provides a database session.

    Usage:
        @router.get("/items")
        async def get_items(db: AsyncSession = Depends(get_db)):
            ...

    Yields:
        AsyncSession: Database session that auto-closes after request
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def check_database_connection() -> bool:
    """
    Check if the database connection is healthy.

    Returns:
        bool: True if database is reachable, False otherwise
    """
    try:
        from sqlalchemy import text
        async with async_engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
            return True
    except Exception as e:
        logger.error(f"Database connection failed: {e}")
        return False
