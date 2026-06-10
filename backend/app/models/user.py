"""
User model - Represents both Riders and Drivers in the system.

Uses a single table with role discrimination for simplicity in MVP.
Can be split into separate Rider/Driver tables in production if needed.

TODO Step 4: Add authentication fields:
    - hashed_password: str (for email/password auth)
    - phone_verified: bool
    - email_verified: bool
    - driver_verified: bool (for driver onboarding)

TODO Step 2: Add real-time location fields:
    - current_lat: float (nullable, for drivers)
    - current_lng: float (nullable, for drivers)
    - location_updated_at: datetime (nullable)
    - is_online: bool (for drivers to toggle availability)
"""
import uuid
from datetime import datetime
from enum import Enum as PyEnum

from sqlalchemy import Boolean, Column, DateTime, Enum, String
from sqlalchemy.dialects.postgresql import UUID

from app.db.base import Base


class UserRole(str, PyEnum):
    """User role enumeration."""
    RIDER = "rider"
    DRIVER = "driver"
    ADMIN = "admin"  # For future admin dashboard


class User(Base):
    """
    User model representing both riders and drivers.

    Attributes:
        id: UUID primary key
        name: Full name of the user
        email: Unique email address
        phone: Phone number for ride coordination
        role: User type (rider/driver/admin)
        is_active: Whether the account is active
        created_at: Account creation timestamp
        updated_at: Last update timestamp
    """

    # Override auto-generated table name
    __tablename__ = "users"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True,
        comment="Unique user identifier"
    )
    name = Column(
        String(100),
        nullable=False,
        comment="Full name of the user"
    )
    email = Column(
        String(255),
        unique=True,
        nullable=False,
        index=True,
        comment="Email address (unique)"
    )
    phone = Column(
        String(20),
        nullable=True,
        comment="Phone number for ride coordination"
    )
    role = Column(
        Enum(UserRole, name="user_role_enum"),
        nullable=False,
        default=UserRole.RIDER,
        comment="User type: rider, driver, or admin"
    )

    # Account status
    is_active = Column(
        Boolean,
        default=True,
        nullable=False,
        comment="Whether the account is active"
    )

    # Timestamps
    created_at = Column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        nullable=False,
        comment="Account creation timestamp"
    )
    updated_at = Column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
        comment="Last update timestamp"
    )

    # TODO Step 4: Add password hashing
    # hashed_password = Column(String(255), nullable=True)

    # TODO Step 2: Add driver location tracking
    # current_lat = Column(Float, nullable=True)
    # current_lng = Column(Float, nullable=True)
    # location_updated_at = Column(DateTime(timezone=True), nullable=True)
    # is_online = Column(Boolean, default=False)  # For drivers

    def __repr__(self) -> str:
        """String representation of the User."""
        return f"<User(id={self.id}, name={self.name}, email={self.email}, role={self.role})>"
