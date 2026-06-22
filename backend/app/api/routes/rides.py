"""
Ride API routes - Complete ride lifecycle management.

Provides endpoints for:
- Requesting a new ride
- Accepting/rejecting rides (driver)
- Updating ride status (arrived, started, completed)
- Cancelling rides
- Listing rides (with filtering)

TODO Step 2: Integrate WebSocket events for real-time updates
TODO Step 2: Add driver matching algorithm
TODO Step 3: Add fare calculation and Stripe payment
TODO Step 2: Add polyline route generation
"""
from datetime import datetime
import asyncio
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.core.logging import get_logger
from app.models.ride import Ride, RideStatus
from app.schemas.ride import (
    RideConfirmRequest,
    RideConfirmResponse,
    RideRequest,
    RideResponse,
    RideStatusUpdate,
)
from app.services.driver_simulation import simulate_driver_movement
from app.services.navigation import mapbox_route, calculate_fare
from app.services.stripe import stripe_service
from app.models.ride import PaymentStatus

logger = get_logger(__name__)
router = APIRouter(prefix="/rides", tags=["rides"])


@router.post(
    "/confirm",
    response_model=RideConfirmResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Confirm ride and start simulation",
    description="Schedules a background driver simulation that streams location updates over WebSocket.",
)
async def confirm_ride(ride: RideConfirmRequest) -> RideConfirmResponse:
    """Trigger driver movement simulation in the background for a ride."""
    asyncio.create_task(
        simulate_driver_movement(
            ride_id=ride.ride_id,
            encoded_polyline=ride.encoded_polyline,
            pickup_lat=ride.pickup_lat,
            pickup_lng=ride.pickup_lng,
        )
    )

    return RideConfirmResponse(
        ride_id=ride.ride_id,
        status="SIMULATION_STARTED",
        detail="Driver simulation started",
    )


@router.post(
    "",
    response_model=RideResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Request a new ride",
    description="Create a new ride request from pickup to dropoff location.",
)
async def request_ride(
    ride_data: RideRequest,
    db: AsyncSession = Depends(get_db),
    # TODO Step 4: Replace with authenticated user
    # current_user: dict = Depends(get_current_user),
) -> Ride:
    """
    Request a new ride.

    Args:
        ride_data: Pickup and dropoff locations
        db: Database session

    Returns:
        Created ride object

    TODO Step 2:
        - Emit WebSocket event: "ride:requested" to nearby drivers
        - Start driver matching algorithm
        - Calculate estimated fare based on distance

    TODO Step 3:
        - Create Stripe PaymentIntent for pre-auth
        - Store payment_intent_id on the ride
    """
    # TODO Step 4: Use authenticated rider_id
    # rider_id = UUID(current_user["id"])
    rider_id = UUID("00000000-0000-0000-0000-000000000001")  # Mock for now

    # Calculate actual route metrics using Mapbox Directions API
    try:
        route_data = await mapbox_route(
            pickup_lat=ride_data.pickup.lat,
            pickup_lng=ride_data.pickup.lng,
            dropoff_lat=ride_data.dropoff.lat,
            dropoff_lng=ride_data.dropoff.lng,
        )
        distance = route_data["distance"]  # meters
        duration = route_data["duration"]  # seconds
        encoded_polyline = route_data["encoded_polyline"]
        estimated_fare = calculate_fare(distance, duration)
    except Exception:
        logger.exception("Failed to calculate route metrics for ride request, using defaults")
        distance = 0.0
        duration = 0.0
        encoded_polyline = None
        estimated_fare = 15.0  # default fallback fare in USD

    # Create Stripe PaymentIntent with manual capture (pre-authorization)
    amount_cents = int(estimated_fare * 100)
    client_secret = None
    stripe_intent_id = None
    payment_status = PaymentStatus.PENDING

    if amount_cents > 0:
        try:
            intent = await stripe_service.create_payment_intent(amount_cents, "usd")
            stripe_intent_id = intent["id"]
            client_secret = intent["client_secret"]
            payment_status = PaymentStatus.AUTHORIZED
        except Exception:
            logger.exception("Failed to pre-authorize fare with Stripe")
            payment_status = PaymentStatus.FAILED

    ride = Ride(
        rider_id=rider_id,
        status=RideStatus.REQUESTED,
        pickup_lat=ride_data.pickup.lat,
        pickup_lng=ride_data.pickup.lng,
        pickup_address=ride_data.pickup.address,
        dropoff_lat=ride_data.dropoff.lat,
        dropoff_lng=ride_data.dropoff.lng,
        dropoff_address=ride_data.dropoff.address,
        estimated_fare=estimated_fare,
        distance=distance,
        duration=duration,
        encoded_polyline=encoded_polyline,
        payment_status=payment_status,
        stripe_payment_intent_id=stripe_intent_id,
    )

    db.add(ride)
    await db.commit()
    await db.refresh(ride)

    # Attach client secret dynamically to response object (not saved in database)
    ride.client_secret = client_secret

    logger.info(f"Ride requested: {ride.id} by rider {rider_id}")

    # TODO Step 2: Emit WebSocket event to nearby drivers
    # await websocket_manager.broadcast_to_drivers({
    #     "event": "ride:requested",
    #     "ride": ride.to_websocket_payload(),
    # })

    return ride


@router.get(
    "",
    response_model=List[RideResponse],
    summary="List rides",
    description="Get rides with optional status and user filtering.",
)
async def list_rides(
    status: str = Query(None, description="Filter by ride status"),
    rider_id: UUID = Query(None, description="Filter by rider"),
    driver_id: UUID = Query(None, description="Filter by driver"),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
) -> List[Ride]:
    """
    List rides with optional filtering.

    Args:
        status: Filter by ride status
        rider_id: Filter by rider UUID
        driver_id: Filter by driver UUID
        skip: Pagination offset
        limit: Page size
        db: Database session

    Returns:
        List of ride objects
    """
    query = select(Ride)

    if status:
        query = query.where(Ride.status == RideStatus(status))
    if rider_id:
        query = query.where(Ride.rider_id == rider_id)
    if driver_id:
        query = query.where(Ride.driver_id == driver_id)

    query = query.offset(skip).limit(limit).order_by(Ride.created_at.desc())

    result = await db.execute(query)
    return result.scalars().all()


@router.get(
    "/{ride_id}",
    response_model=RideResponse,
    summary="Get ride details",
    description="Get detailed information about a specific ride.",
)
async def get_ride(
    ride_id: UUID,
    db: AsyncSession = Depends(get_db),
) -> Ride:
    """
    Get a ride by its UUID.

    Args:
        ride_id: Ride's UUID
        db: Database session

    Returns:
        Ride object with full details

    Raises:
        HTTPException 404: If ride not found
    """
    ride = await db.get(Ride, ride_id)
    if not ride:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Ride with ID {ride_id} not found",
        )
    return ride


@router.patch(
    "/{ride_id}/status",
    response_model=RideResponse,
    summary="Update ride status",
    description="""
    Update ride status through its lifecycle:
    - accepted: Driver accepts the ride
    - arrived: Driver arrives at pickup
    - in_progress: Ride starts
    - completed: Ride finishes
    - cancelled: Ride is cancelled
    """,
)
async def update_ride_status(
    ride_id: UUID,
    status_update: RideStatusUpdate,
    db: AsyncSession = Depends(get_db),
    # TODO Step 4: current_user: dict = Depends(get_current_user),
) -> Ride:
    """
    Update ride status and track lifecycle timestamps.

    Args:
        ride_id: Ride's UUID
        status_update: New status and optional cancellation info
        db: Database session

    Returns:
        Updated ride object

    TODO Step 2: Emit WebSocket status update to rider and driver
    TODO Step 3: Process payment on completion
    """
    ride = await db.get(Ride, ride_id)
    if not ride:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Ride with ID {ride_id} not found",
        )

    new_status = RideStatus(status_update.status)
    now = datetime.utcnow()

    # Validate status transitions
    valid_transitions = {
        RideStatus.REQUESTED: [RideStatus.SEARCHING, RideStatus.CANCELLED],
        RideStatus.SEARCHING: [RideStatus.ACCEPTED, RideStatus.CANCELLED],
        RideStatus.ACCEPTED: [RideStatus.ARRIVED, RideStatus.CANCELLED],
        RideStatus.ARRIVED: [RideStatus.IN_PROGRESS, RideStatus.CANCELLED],
        RideStatus.IN_PROGRESS: [RideStatus.COMPLETED],
        RideStatus.COMPLETED: [],
        RideStatus.CANCELLED: [],
    }

    if new_status not in valid_transitions.get(ride.status, []):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status transition: {ride.status} -> {new_status}",
        )

    # Update status
    ride.status = new_status

    # Set lifecycle timestamps
    if new_status == RideStatus.ACCEPTED:
        ride.accepted_at = now
        # TODO Step 4: Set driver_id from authenticated user
        # ride.driver_id = UUID(current_user["id"])
    elif new_status == RideStatus.ARRIVED:
        ride.arrived_at = now
    elif new_status == RideStatus.IN_PROGRESS:
        ride.started_at = now
    elif new_status == RideStatus.COMPLETED:
        ride.completed_at = now
        ride.final_fare = ride.estimated_fare
        if ride.stripe_payment_intent_id:
            try:
                await stripe_service.capture_payment_intent(ride.stripe_payment_intent_id)
                ride.payment_status = PaymentStatus.CAPTURED
            except Exception:
                logger.exception("Failed to capture Stripe payment for completed ride %s", ride_id)
                ride.payment_status = PaymentStatus.FAILED
    elif new_status == RideStatus.CANCELLED:
        ride.cancelled_at = now
        ride.cancelled_by = status_update.cancelled_by or "rider"
        ride.cancellation_reason = status_update.reason
        if ride.stripe_payment_intent_id:
            try:
                await stripe_service.cancel_payment_intent(ride.stripe_payment_intent_id)
                ride.payment_status = PaymentStatus.REFUNDED
            except Exception:
                logger.exception("Failed to void Stripe payment for cancelled ride %s", ride_id)

    await db.commit()
    await db.refresh(ride)

    logger.info(f"Ride {ride_id} status updated to {new_status}")

    # TODO Step 2: Broadcast status update via WebSocket
    # await websocket_manager.broadcast_to_ride_participants(
    #     ride_id,
    #     {
    #         "event": "ride:status_updated",
    #         "ride_id": str(ride_id),
    #         "status": new_status.value,
    #         "timestamp": now.isoformat(),
    #     }
    # )

    return ride


@router.post(
    "/{ride_id}/accept",
    response_model=RideResponse,
    summary="Accept a ride (driver)",
    description="Driver accepts a pending ride request.",
)
async def accept_ride(
    ride_id: UUID,
    db: AsyncSession = Depends(get_db),
    # TODO Step 4: current_driver: dict = Depends(get_current_driver),
) -> Ride:
    """
    Convenience endpoint for drivers to accept a ride.

    Args:
        ride_id: Ride's UUID
        db: Database session

    Returns:
        Updated ride object
    """
    # TODO Step 4: Use authenticated driver ID
    # driver_id = UUID(current_driver["id"])

    status_update = RideStatusUpdate(status="accepted")
    return await update_ride_status(ride_id, status_update, db)


# TODO Step 2: Add real-time driver location streaming endpoint
# @router.post("/{ride_id}/driver-location")
# async def update_driver_location(
#     ride_id: UUID,
#     lat: float,
#     lng: float,
#     db: AsyncSession = Depends(get_db),
# ):
#     """Stream driver location updates to rider via WebSocket."""
#     # TODO: Emit WebSocket event to rider
#     pass


# TODO Step 3: Add fare calculation endpoint
# @router.post("/calculate-fare")
# async def calculate_fare(
#     pickup: Location,
#     dropoff: Location,
# ):
#     """Calculate estimated fare before requesting a ride."""
#     # TODO: Integrate with distance matrix API + pricing engine
#     pass


# TODO Step 2: Add ride tracking endpoint (polyline)
# @router.get("/{ride_id}/route")
# async def get_ride_route(ride_id: UUID):
#     """Get the route polyline for a ride."""
#     # TODO: Return encoded polyline for map rendering
#     pass
