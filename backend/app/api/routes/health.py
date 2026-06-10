"""
Health check endpoint for monitoring and load balancers.

Provides:
- Basic server status (always returns 200 if server is running)
- Database connectivity check
- Environment information (safe for public exposure)

TODO: Add Redis connectivity check when implementing Step 2
TODO: Add external API health checks (Mapbox, Stripe) when integrated
"""
from datetime import datetime
from typing import Any, Dict

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.core.config import get_settings
from app.core.logging import get_logger
from app.db.base import check_database_connection

logger = get_logger(__name__)
router = APIRouter(prefix="/health", tags=["health"])


@router.get(
    "",
    response_model=Dict[str, Any],
    status_code=status.HTTP_200_OK,
    summary="Health check endpoint",
    description="Returns server status and database connectivity information.",
)
async def health_check(db: AsyncSession = Depends(get_db)) -> Dict[str, Any]:
    """
    Comprehensive health check endpoint.

    Checks:
    - Server is running (always true if this responds)
    - Database connection is healthy
    - Returns current timestamp and environment info

    Returns:
        Dict containing status, database health, and metadata

    Example response:
        {
            "status": "healthy",
            "timestamp": "2024-01-15T10:30:00.000Z",
            "environment": "development",
            "version": "1.0.0",
            "services": {
                "database": "connected",
                "server": "running"
            }
        }
    """
    settings = get_settings()

    # Check database connectivity
    db_healthy = await check_database_connection()

    # Determine overall status
    overall_status = "healthy" if db_healthy else "degraded"

    response = {
        "status": overall_status,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "environment": settings.environment,
        "version": "1.0.0",  # TODO: Move to config or version file
        "services": {
            "database": "connected" if db_healthy else "disconnected",
            "server": "running",
            # TODO Step 2: Add Redis health check
            # "redis": "connected" if redis_healthy else "disconnected",
            # TODO: Add Mapbox API health check
            # "mapbox": "available" if mapbox_healthy else "unavailable",
        },
    }

    if not db_healthy:
        logger.warning("Health check: Database connection failed")

    return response


@router.get(
    "/ping",
    response_model=Dict[str, str],
    status_code=status.HTTP_200_OK,
    summary="Simple ping endpoint",
    description="Lightweight endpoint for load balancer health checks.",
)
async def ping() -> Dict[str, str]:
    """
    Simple ping endpoint for load balancers.

    Returns minimal response for quick health checks without
    database overhead.

    Returns:
        Dict with simple status message
    """
    return {"status": "ok"}
