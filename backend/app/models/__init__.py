"""
Database models package.

Import all models here so Alembic can discover them for migrations.
"""
from app.db.base import Base
from app.models.user import User
from app.models.ride import Ride

# Export all models and Base
__all__ = ["Base", "User", "Ride"]
