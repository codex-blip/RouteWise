"""
Main API router aggregator.

Combines all sub-routers into a single router mounted at /api/v1.
Add new route modules here as they are created.

TODO: Add routers for:
    - WebSocket events (Step 2)
    - Payments/Stripe webhooks (Step 3)
    - Authentication (Step 4)
    - Admin endpoints (Step 5)
"""
from fastapi import APIRouter

from app.api.routes import health, rides, users, navigation

# Create main API router with version prefix
api_router = APIRouter(prefix="/api/v1")

# Health check (public, no auth required)
api_router.include_router(health.router)

# User management
api_router.include_router(users.router)

# Ride lifecycle
api_router.include_router(rides.router)

# Navigation (geocoding + routing)
api_router.include_router(navigation.router)

# TODO Step 4: Authentication routes
# from app.api.routes import auth
# api_router.include_router(auth.router, prefix="/auth", tags=["auth"])

# TODO Step 2: WebSocket event routes (REST fallbacks)
# from app.api.routes import websocket_events
# api_router.include_router(websocket_events.router, prefix="/ws")

# TODO Step 3: Payment routes
# from app.api.routes import payments
# api_router.include_router(payments.router, prefix="/payments", tags=["payments"])

# TODO Step 5: Admin routes
# from app.api.routes import admin
# api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
