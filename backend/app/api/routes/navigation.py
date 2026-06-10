from typing import List

from fastapi import APIRouter, HTTPException, Query

from app.services import navigation as nav_service
from app.schemas.navigation import SearchResponse, RouteRequest, RouteResponse

router = APIRouter(prefix="/navigation", tags=["navigation"])


@router.get("/search", response_model=SearchResponse)
async def search_locations(q: str = Query(..., min_length=1), limit: int = Query(5, ge=1, le=10)):
    """Search for places using provider geocoding (Mapbox by default)."""
    try:
        results = await nav_service.mapbox_search(q, limit=limit)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

    return {"results": results}


@router.post("/route", response_model=RouteResponse)
async def get_route(body: RouteRequest):
    """Return route geometry, distance, duration and estimated fare."""
    try:
        route = await nav_service.mapbox_route(
            body.pickup_lat, body.pickup_lng, body.dropoff_lat, body.dropoff_lng
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

    fare = nav_service.calculate_fare(route["distance"], route["duration"])

    return {
        "encoded_polyline": route["encoded_polyline"],
        "distance": route["distance"],
        "duration": route["duration"],
        "estimated_fare": fare,
    }
