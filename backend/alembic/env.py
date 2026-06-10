"""
Alembic migration environment configuration.

This script configures Alembic to work with async SQLAlchemy.
It loads database settings from the application config and sets up
the migration context.

Usage:
    # Auto-generate migration from model changes
    alembic revision --autogenerate -m "Add users table"

    # Apply pending migrations
    alembic upgrade head

    # Rollback one migration
    alembic downgrade -1

    # Show current revision
    alembic current
"""
import asyncio
from logging.config import fileConfig

from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config

from alembic import context

# Import application models so Alembic can detect schema changes
from app.core.config import get_settings
from app.db.base import Base
from app.models import *  # noqa: F401, F403 - Import all models

# Alembic Config object
config = context.config

# Interpret the config file for Python logging
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Set target metadata for autogenerate support
target_metadata = Base.metadata

# Get database URL from application settings
settings = get_settings()
DATABASE_URL = str(settings.database_url)

# Override sqlalchemy.url in alembic.ini with environment variable
config.set_main_option("sqlalchemy.url", DATABASE_URL)


def run_migrations_offline() -> None:
    """
    Run migrations in 'offline' mode.

    This configures the context with just a URL and not an Engine.
    Calls to context.execute() will emit the given string to the script output.
    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        # Compare types to detect column type changes
        compare_type=True,
        # Compare server defaults
        compare_server_default=True,
    )

    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    """Configure and run migrations with a database connection."""
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
        # Enable type comparison for autogenerate
        compare_type=True,
        # Enable server default comparison
        compare_server_default=True,
        # Include all schemas
        include_schemas=True,
    )

    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    """Run migrations in async mode with asyncpg driver."""
    # Create async engine from configuration
    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    async with connectable.connect() as connection:
        # Run migrations within the connection
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


def run_migrations_online() -> None:
    """
    Run migrations in 'online' mode.

    Creates an Engine and associates a connection with the context.
    Handles both sync and async execution.
    """
    # Use asyncio to run async migrations
    asyncio.run(run_async_migrations())


# Determine execution mode and run migrations
if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
