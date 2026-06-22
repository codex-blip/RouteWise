from __future__ import annotations

import asyncio

import polyline

from app.core.logging import get_logger
from app.services.websocket_manager import connection_manager

logger = get_logger(__name__)


async def simulate_driver_movement(ride_id: str, encoded_polyline: str) -> None:
    """Simulate a driver moving along the route and stream coordinates over websockets."""
    try:
        coordinates = polyline.decode(encoded_polyline)
    except Exception:
        logger.exception("Failed to decode polyline for ride %s", ride_id)
        await connection_manager.broadcast_to_ride(
            ride_id,
            {"status": "ARRIVED"},
        )
        return

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
