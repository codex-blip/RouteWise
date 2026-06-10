from typing import Any, Dict, List, Optional
from urllib.parse import quote

import httpx

from app.core.config import get_settings


def calculate_fare(distance_meters: float, duration_seconds: float) -> float:
    """Simple fare calculation.

    Formula:
      fare = base + per_km * (distance_meters / 1000) + per_min * (duration_seconds / 60)

    Returns fare in the same currency units (e.g., USD).
    """
    base = 2.0
    per_km = 1.5
    per_min = 0.25

    km = distance_meters / 1000.0
    minutes = duration_seconds / 60.0
    fare = base + per_km * km + per_min * minutes
    # Round to two decimals
    return round(fare, 2)


async def mapbox_search(query: str, limit: int = 5) -> List[Dict[str, Any]]:
    """Forward geocode using Mapbox Geocoding API.

    Returns a list of features with `id`, `place_name`, and `center` [lng, lat].
    """
    settings = get_settings()
    token = settings.mapbox_api_key
    if not token:
        raise RuntimeError("Mapbox API key is not configured on the server")

    url = f"https://api.mapbox.com/geocoding/v5/mapbox.places/{quote(query)}.json"
    params = {
        "access_token": token,
        "limit": limit,
    }

    async with httpx.AsyncClient() as client:
        resp = await client.get(url, params=params, timeout=10.0)
        resp.raise_for_status()
        data = resp.json()

    results: List[Dict[str, Any]] = []
    for f in data.get("features", []):
        center = f.get("center", [])
        results.append(
            {
                "id": f.get("id"),
                "place_name": f.get("place_name"),
                "text": f.get("text"),
                "center": center,  # [lng, lat]
            }
        )
    return results


async def mapbox_route(pickup_lat: float, pickup_lng: float, dropoff_lat: float, dropoff_lng: float) -> Dict[str, Any]:
    """Call Mapbox Directions API and return encoded polyline, distance (m), duration (s)."""
    settings = get_settings()
    token = settings.mapbox_api_key
    if not token:
        raise RuntimeError("Mapbox API key is not configured on the server")

    coords = f"{pickup_lng},{pickup_lat};{dropoff_lng},{dropoff_lat}"
    url = f"https://api.mapbox.com/directions/v5/mapbox/driving/{coords}"
    params = {
        "access_token": token,
        "geometries": "polyline",  # encoded polyline
        "overview": "full",
        "annotations": "distance,duration",
    }

    async with httpx.AsyncClient() as client:
        resp = await client.get(url, params=params, timeout=15.0)
        resp.raise_for_status()
        data = resp.json()

    routes = data.get("routes") or []
    if not routes:
        raise RuntimeError("No route returned from mapping provider")

    route = routes[0]
    encoded = route.get("geometry")
    distance = route.get("distance")  # meters
    duration = route.get("duration")  # seconds

    return {
        "encoded_polyline": encoded,
        "distance": distance,
        "duration": duration,
    }
