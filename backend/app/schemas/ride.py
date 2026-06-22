"""
Pydantic schemas for Ride model.

Defines request/response models for ride lifecycle operations.
Includes schemas for ride requests, status updates, and responses.

TODO Step 2: Add WebSocket message schemas for real-time updates
TODO Step 3: Add payment-related schemas
"""
from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field, field_validator


class Location(BaseModel):
    """Schema for geographic coordinates."""
    lat: float = Field(..., ge=-90, le=90, description="Latitude")
    lng: float = Field(..., ge=-180, le=180, description="Longitude")
    address: Optional[str] = Field(None, max_length=500, description="Human-readable address")


class RideRequest(BaseModel):
    """Schema for requesting a new ride."""
    pickup: Location = Field(..., description="Pickup location")
    dropoff: Location = Field(..., description="Dropoff location")
    # TODO Step 2: Add ride preferences
    # ride_type: str = Field(default="economy", description="Ride tier: economy/premium/xl")
    # payment_method_id: Optional[str] = None  # Step 3

    @field_validator("pickup", "dropoff")
    @classmethod
    def validate_coordinates(cls, v: Location) -> Location:
        """Additional validation for coordinates."""
        if v.lat == 0 and v.lng == 0:
            raise ValueError("Invalid coordinates: lat and lng cannot both be 0")
        return v


class RideStatusUpdate(BaseModel):
    """Schema for updating ride status."""
    status: str = Field(..., pattern="^(accepted|arrived|in_progress|completed|cancelled)$")
    # For cancellations
    reason: Optional[str] = Field(None, max_length=500, description="Cancellation reason")
    cancelled_by: Optional[str] = Field(None, pattern="^(rider|driver|system)$")


class RideResponse(BaseModel):
    """Schema for ride responses."""
    id: UUID
    rider_id: UUID
    driver_id: Optional[UUID] = None
    status: str

    # Locations
    pickup_lat: float
    pickup_lng: float
    pickup_address: Optional[str] = None
    dropoff_lat: float
    dropoff_lng: float
    dropoff_address: Optional[str] = None

    # TODO Step 2: Route information
    # route_polyline: Optional[str] = None
    # estimated_duration_minutes: Optional[int] = None
    # estimated_distance_meters: Optional[int] = None

    # Fare
    estimated_fare: Optional[float] = None
    final_fare: Optional[float] = None

    # Payment fields
    payment_status: Optional[str] = None
    stripe_payment_intent_id: Optional[str] = None
    client_secret: Optional[str] = None

    # Cancellation
    cancelled_by: Optional[str] = None
    cancellation_reason: Optional[str] = None

    # Timestamps
    created_at: datetime
    updated_at: datetime
    accepted_at: Optional[datetime] = None
    arrived_at: Optional[datetime] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    cancelled_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class RideListResponse(BaseModel):
    """Schema for paginated ride list responses."""
    items: list[RideResponse]
    total: int
    page: int
    page_size: int


class RideConfirmRequest(BaseModel):
    """Schema to confirm a ride and start driver simulation."""
    ride_id: str = Field(..., min_length=1, max_length=128)
    encoded_polyline: str = Field(..., min_length=1)
    pickup_lat: float = Field(..., ge=-90, le=90, description="Pickup latitude")
    pickup_lng: float = Field(..., ge=-180, le=180, description="Pickup longitude")


class RideConfirmResponse(BaseModel):
    """Schema returned after simulation is scheduled."""
    ride_id: str
    status: str
    detail: str


# TODO Step 2: WebSocket message schemas
# class RideLocationUpdate(BaseModel):
#     """Real-time driver location update (WebSocket)."""
#     ride_id: UUID
#     driver_id: UUID
#     lat: float
#     lng: float
#     timestamp: datetime
#
# class RideStatusEvent(BaseModel):
#     """Ride status change event for WebSocket broadcast."""
#     ride_id: UUID
#     status: str
#     timestamp: datetime
#     message: Optional[str] = None
