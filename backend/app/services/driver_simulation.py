from __future__ import annotations

import asyncio
import math
import random

import polyline

from app.core.logging import get_logger
from app.services.navigation import mapbox_route
from app.services.websocket_manager import connection_manager

logger = get_logger(__name__)


async def simulate_driver_movement(
    ride_id: str,
    encoded_polyline: str,
    pickup_lat: float,
    pickup_lng: float,
) -> None:
    """Simulate a driver moving from a random location to the pickup location."""
    # Generate random driver starting location within 1.0 to 2.0 km of the pickup
    dist = random.uniform(1.0, 2.0)
    bearing = random.uniform(0, 2 * math.pi)
    
    # 1 degree of latitude is approximately 111.32 km
    # 1 degree of longitude is approximately 111.32 * cos(lat) km
    lat_offset = (dist * math.sin(bearing)) / 111.32
    lng_offset = (dist * math.cos(bearing)) / (111.32 * math.cos(math.radians(pickup_lat)))
    
    driver_start_lat = pickup_lat + lat_offset
    driver_start_lng = pickup_lng + lng_offset

    logger.info(
        "Simulating driver for ride %s from starting location (%f, %f) to pickup (%f, %f)",
        ride_id,
        driver_start_lat,
        driver_start_lng,
        pickup_lat,
        pickup_lng,
    )

    try:
        route_data = await mapbox_route(
            pickup_lat=driver_start_lat,
            pickup_lng=driver_start_lng,
            dropoff_lat=pickup_lat,
            dropoff_lng=pickup_lng,
        )
        coordinates = polyline.decode(route_data["encoded_polyline"])
    except Exception:
        logger.exception("Failed to get Mapbox route for driver to pickup, falling back to straight-line path")
        # Simple interpolation fallback if Mapbox route fails
        coordinates = [
            (
                driver_start_lat + (pickup_lat - driver_start_lat) * (i / 10.0),
                driver_start_lng + (pickup_lng - driver_start_lng) * (i / 10.0),
            )
            for i in range(11)
        ]

    for lat, lng in coordinates:
        await asyncio.sleep(1)
        await connection_manager.broadcast_to_ride(
            ride_id,
            {
                "lat": lat,
                "lng": lng,
                "status": "EN_ROUTE",
            },
        )

    await connection_manager.broadcast_to_ride(
        ride_id,
        {"status": "ARRIVED"},
    )

