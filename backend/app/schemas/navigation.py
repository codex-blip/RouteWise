from pydantic import BaseModel, Field
from typing import List, Optional


class Suggestion(BaseModel):
    id: str
    place_name: str
    text: Optional[str]
    center: List[float]  # [lng, lat]


class SearchResponse(BaseModel):
    results: List[Suggestion]


class RouteRequest(BaseModel):
    pickup_lat: float
    pickup_lng: float
    dropoff_lat: float
    dropoff_lng: float


class RouteResponse(BaseModel):
    encoded_polyline: str = Field(..., description="Encoded polyline (Mapbox)")
    distance: float = Field(..., description="Total distance in meters")
    duration: float = Field(..., description="Total duration in seconds")
    estimated_fare: float = Field(..., description="Estimated fare in currency units")
