"""
FastAPI application entry point.

Configures the main FastAPI app with:
- CORS middleware for Next.js frontend communication
- API router mounting at /api/v1
- Event handlers for startup/shutdown
- Health check endpoints

TODO Step 2: Add WebSocket route for Socket.io
TODO Step 4: Add authentication middleware
TODO Step 5: Add rate limiting middleware
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.core.config import get_settings
from app.core.logging import get_logger, setup_logging
from app.db.base import async_engine

logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager.

    Handles startup and shutdown events:
    - Startup: Initialize logging, verify database connection
    - Shutdown: Clean up database connections

    Args:
        app: FastAPI application instance
    """
    # Startup
    setup_logging()
    settings = get_settings()

    logger.info(f"Starting {settings.app_name} in {settings.environment} mode")
    logger.info(f"Debug mode: {settings.debug}")
    logger.info(f"CORS origins: {settings.cors_origins}")

    # TODO: Verify database connection on startup
    # from app.db.base import check_database_connection
    # db_healthy = await check_database_connection()
    # if not db_healthy:
    #     logger.warning("Database connection failed during startup!")

    # TODO Step 2: Initialize Redis connection
    # from app.services.redis import init_redis
    # await init_redis()

    # TODO Step 2: Initialize WebSocket manager
    # from app.services.websocket import init_websocket_manager
    # await init_websocket_manager()

    yield  # Application runs during this period

    # Shutdown
    logger.info("Shutting down application")

    # Dispose database engine
    await async_engine.dispose()

    # TODO Step 2: Close Redis connection
    # from app.services.redis import close_redis
    # await close_redis()


def create_application() -> FastAPI:
    """
    Application factory pattern.

    Creates and configures the FastAPI application with all middleware,
    routers, and event handlers.

    Returns:
        Configured FastAPI application instance
    """
    settings = get_settings()

    app = FastAPI(
        title=settings.app_name,
        description="""
        Uber Clone API - MVP Backend

        ## Features
        - User management (riders & drivers)
        - Ride request lifecycle
        - Real-time location tracking (Step 2)
        - Payment processing (Step 3)
        - Authentication (Step 4)

        ## Architecture
        - FastAPI with async support
        - PostgreSQL with SQLAlchemy async ORM
        - Alembic migrations
        - Modular router structure
        """,
        version="1.0.0",
        debug=settings.debug,
        lifespan=lifespan,
        # API documentation URLs
        docs_url="/docs",         # Swagger UI
        redoc_url="/redoc",       # ReDoc
        openapi_url="/openapi.json",
    )

    # Configure CORS middleware
    # Allows Next.js frontend to communicate with the API
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,   # Allow cookies (for auth)
        allow_methods=["*"],      # Allow all HTTP methods
        allow_headers=["*"],      # Allow all headers
        expose_headers=["*"],     # Expose all headers to frontend
        max_age=600,              # Cache preflight requests for 10 minutes
    )

    # Mount API routes
    app.include_router(api_router)

    # TODO Step 2: Mount WebSocket endpoint
    # from app.api.websocket import websocket_endpoint
    # app.add_websocket_route("/ws", websocket_endpoint)

    # TODO Step 4: Add exception handlers for auth errors
    # from app.core.exceptions import auth_exception_handler
    # app.add_exception_handler(AuthError, auth_exception_handler)

    return app


# Create the application instance
# This is imported by uvicorn: uvicorn app.main:app
app = create_application()


# Root endpoint (redirects to docs)
@app.get("/", include_in_schema=False)
async def root():
    """Redirect root to API documentation."""
    return {
        "message": "Uber Clone API",
        "documentation": "/docs",
        "health": "/api/v1/health",
    }
