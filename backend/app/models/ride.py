"""
Ride model - Represents a ride request and its lifecycle.

Tracks the complete journey from request to completion with spatial data
for pickup and dropoff locations.

TODO Step 2: Add WebSocket event triggers for status changes
TODO Step 2: Add route polyline for map display
TODO Step 3: Add payment fields (fare, payment_status, stripe_payment_intent_id)
TODO Step 2: Add PostGIS spatial columns for efficient geo queries:
    - pickup_location = Column(Geometry('POINT', srid=4326))
    - dropoff_location = Column(Geometry('POINT', srid=4326))
"""
import uuid
from datetime import datetime
from enum import Enum as PyEnum

from sqlalchemy import (
    Column,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.base import Base


class RideStatus(str, PyEnum):
    """Ride status lifecycle enumeration."""
    REQUESTED = "requested"       # Rider requested a ride
    SEARCHING = "searching"       # System searching for nearby drivers
    ACCEPTED = "accepted"         # Driver accepted the ride
    ARRIVED = "arrived"           # Driver arrived at pickup
    IN_PROGRESS = "in_progress"   # Ride started, en route to destination
    COMPLETED = "completed"       # Ride finished successfully
    CANCELLED = "cancelled"       # Ride was cancelled


class Ride(Base):
    """
    Ride model representing a complete ride request.

    Attributes:
        id: UUID primary key
        rider_id: FK to the requesting user
        driver_id: FK to the assigned driver (nullable until accepted)
        status: Current ride status
        pickup_lat, pickup_lng: Pickup location coordinates
        dropoff_lat, dropoff_lng: Destination coordinates
        pickup_address: Human-readable pickup address
        dropoff_address: Human-readable destination address
        estimated_fare: Calculated fare estimate
        final_fare: Actual fare after ride completion
        cancelled_by: Who cancelled (rider/driver/system)
        cancellation_reason: Reason for cancellation
        created_at: Request timestamp
        updated_at: Last status update
        accepted_at: When driver accepted
        arrived_at: When driver arrived at pickup
        started_at: When ride began
        completed_at: When ride finished
        cancelled_at: When ride was cancelled
    """

    __tablename__ = "rides"

    # Primary key
    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True,
        comment="Unique ride identifier"
    )

    # Foreign keys - UUID references to users table
    rider_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=False,
        index=True,
        comment="Rider who requested the ride"
    )
    driver_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
        comment="Assigned driver (null until accepted)"
    )

    # Ride status
    status = Column(
        Enum(RideStatus, name="ride_status_enum"),
        nullable=False,
        default=RideStatus.REQUESTED,
        index=True,
        comment="Current ride status"
    )

    # Pickup location (latitude/longitude)
    pickup_lat = Column(
        Float,
        nullable=False,
        comment="Pickup latitude"
    )
    pickup_lng = Column(
        Float,
        nullable=False,
        comment="Pickup longitude"
    )
    pickup_address = Column(
        String(500),
        nullable=True,
        comment="Human-readable pickup address"
    )

    # Dropoff location (latitude/longitude)
    dropoff_lat = Column(
        Float,
        nullable=False,
        comment="Dropoff latitude"
    )
    dropoff_lng = Column(
        Float,
        nullable=False,
        comment="Dropoff longitude"
    )
    dropoff_address = Column(
        String(500),
        nullable=True,
        comment="Human-readable dropoff address"
    )

    # TODO Step 2: Add route polyline for map visualization
    # route_polyline = Column(Text, nullable=True)
    # estimated_duration_minutes = Column(Integer, nullable=True)
    # estimated_distance_meters = Column(Integer, nullable=True)

    # Fare information (Step 3 will expand this with Stripe)
    estimated_fare = Column(
        Float,
        nullable=True,
        comment="Estimated fare in cents (or currency units)"
    )
    # Route & pricing fields
    distance = Column(
        Float,
        nullable=True,
        comment="Total route distance in meters"
    )
    duration = Column(
        Float,
        nullable=True,
        comment="Total route duration in seconds"
    )
    encoded_polyline = Column(
        Text,
        nullable=True,
        comment="Encoded polyline representing the route geometry"
    )
    final_fare = Column(
        Float,
        nullable=True,
        comment="Final fare after ride completion"
    )

    # TODO Step 3: Payment fields
    # payment_status = Column(Enum(PaymentStatus), default=PaymentStatus.PENDING)
    # stripe_payment_intent_id = Column(String(100), nullable=True)

    # Cancellation tracking
    cancelled_by = Column(
        String(20),
        nullable=True,
        comment="Who cancelled: rider/driver/system"
    )
    cancellation_reason = Column(
        Text,
        nullable=True,
        comment="Reason for cancellation"
    )

    # Timestamps for ride lifecycle
    created_at = Column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        nullable=False,
        comment="When ride was requested"
    )
    updated_at = Column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
        comment="Last status update"
    )
    accepted_at = Column(
        DateTime(timezone=True),
        nullable=True,
        comment="When driver accepted"
    )
    arrived_at = Column(
        DateTime(timezone=True),
        nullable=True,
        comment="When driver arrived at pickup"
    )
    started_at = Column(
        DateTime(timezone=True),
        nullable=True,
        comment="When ride began"
    )
    completed_at = Column(
        DateTime(timezone=True),
        nullable=True,
        comment="When ride finished"
    )
    cancelled_at = Column(
        DateTime(timezone=True),
        nullable=True,
        comment="When ride was cancelled"
    )

    # Relationships
    rider = relationship(
        "User",
        foreign_keys=[rider_id],
        backref="rides_as_rider",
        lazy="selectin"
    )
    driver = relationship(
        "User",
        foreign_keys=[driver_id],
        backref="rides_as_driver",
        lazy="selectin"
    )

    def __repr__(self) -> str:
        """String representation of the Ride."""
        return (
            f"<Ride(id={self.id}, status={self.status}, "
            f"rider={self.rider_id}, driver={self.driver_id})>"
        )

    # TODO Step 2: Add method to serialize ride data for WebSocket broadcasts
    # def to_websocket_payload(self) -> dict:
    #     """Convert ride to dict for real-time WebSocket updates."""
    #     return { ... }
