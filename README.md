# Uber Clone - Full Stack MVP

A modular, production-ready Uber clone built with **Next.js 14 (App Router)**, **FastAPI**, and **PostgreSQL**. Designed for easy integration of WebSockets, spatial queries, and Stripe payments in subsequent steps.

## Architecture Overview

```
uber-clone/
├── frontend/          # Next.js 14 App Router
│   ├── app/           # App Router pages & layouts
│   ├── components/    # React components (Map, DestinationCard)
│   ├── lib/           # Utility functions & API client
│   └── types/         # Shared TypeScript types
│
└── backend/           # FastAPI Python backend
    ├── app/
    │   ├── api/       # API routers (health, users, rides)
    │   ├── core/      # Config, logging
    │   ├── db/        # SQLAlchemy async session & base
    │   ├── models/    # SQLAlchemy ORM models
    │   ├── schemas/   # Pydantic request/response models
    │   └── services/  # Business logic layer
    └── alembic/       # Database migrations
```

## Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | Next.js 14 + TypeScript | React framework with App Router |
| Styling | Tailwind CSS | Utility-first CSS |
| Maps | Mapbox GL JS + react-map-gl | Interactive maps |
| Backend | FastAPI + Python 3.10+ | Async API framework |
| Database | PostgreSQL 14+ | Primary data store |
| ORM | SQLAlchemy 2.0 (async) | Database abstraction |
| Migrations | Alembic | Schema versioning |
| Validation | Pydantic v2 | Request/response validation |

## Quick Start

### Prerequisites

- **Node.js 18+** and npm/yarn
- **Python 3.10+** and pip
- **PostgreSQL 14+** running locally
- **Mapbox account** (free tier) for map tokens

### 1. Database Setup

Create a PostgreSQL database:

```bash
# Using psql
psql -U postgres -c "CREATE DATABASE uber_clone;"

# Or using createdb command
createdb -U postgres uber_clone
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate (Linux/Mac)
source venv/bin/activate
# Activate (Windows)
# venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment variables
cp .env.example .env
# Edit .env with your database URL and Mapbox token

# Run database migrations
alembic upgrade head
# OR create initial migration from models:
# alembic revision --autogenerate -m "Initial migration"

# Start the server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000` with interactive docs at `/docs`.

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Copy environment variables
cp .env.local.example .env.local
# Add your Mapbox public token to .env.local

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:3000`.

## API Documentation

FastAPI auto-generates interactive documentation:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **OpenAPI Schema**: http://localhost:8000/openapi.json

### Available Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/health` | Health check with DB status |
| GET | `/api/v1/health/ping` | Simple ping |
| GET | `/api/v1/users` | List users (paginated) |
| POST | `/api/v1/users` | Create user |
| GET | `/api/v1/users/{id}` | Get user by ID |
| PATCH | `/api/v1/users/{id}` | Update user |
| DELETE | `/api/v1/users/{id}` | Soft-delete user |
| GET | `/api/v1/rides` | List rides (filtered) |
| POST | `/api/v1/rides` | Request a ride |
| GET | `/api/v1/rides/{id}` | Get ride details |
| PATCH | `/api/v1/rides/{id}/status` | Update ride status |
| POST | `/api/v1/rides/{id}/accept` | Accept ride (driver) |

## Database Migrations

Using Alembic for schema versioning:

```bash
cd backend

# Auto-generate migration from model changes
alembic revision --autogenerate -m "Description of changes"

# Apply pending migrations
alembic upgrade head

# Rollback one migration
alembic downgrade -1

# Show current revision
alembic current

# Show migration history
alembic history --verbose
```

## Frontend Component Architecture

### Map Component (`components/Map.tsx`)

The map is fully abstracted for easy provider swapping:

```typescript
// Current: Mapbox
import Map from '@/components/Map';

// To switch to Google Maps, replace the Map component implementation
// while keeping the same props interface:
interface MapProps {
  viewport: MapViewport;
  onViewportChange: (v: MapViewport) => void;
  onMapClick?: (location: Location) => void;
  pickup?: Location;
  dropoff?: Location;
}
```

### DestinationCard Component (`components/DestinationCard.tsx`)

Floating card overlay for ride input:
- Pickup location selection (with geolocation)
- Destination search with suggestions
- Ride request button
- Extensible for fare display (Step 3) and ride status (Step 2)

## Development Roadmap

### Step 1: Map & Server Skeleton (Current)
- [x] Next.js App Router structure
- [x] Full-screen interactive Mapbox map
- [x] Floating destination input card
- [x] FastAPI modular structure with CORS
- [x] Health check with DB connectivity
- [x] User and Ride SQLAlchemy models
- [x] Alembic migration setup
- [x] Pydantic request/response schemas

### Step 2: Real-Time Features
- [ ] WebSocket integration (Socket.io or native FastAPI WebSockets)
- [ ] Driver location streaming
- [ ] Ride status real-time updates
- [ ] Route polyline generation and display
- [ ] Nearby driver discovery with spatial queries
- [ ] PostGIS integration for geo-indexing
- [ ] Redis for caching driver locations

### Step 3: Payments & Fare System
- [ ] Stripe PaymentIntent integration
- [ ] Fare calculation engine
- [ ] Payment confirmation flow
- [ ] Receipt generation
- [ ] Stripe webhook handling

### Step 4: Authentication
- [ ] JWT-based authentication
- [ ] Email/password registration & login
- [ ] OAuth 2.0 (Google, Apple)
- [ ] Role-based access control (rider/driver/admin)
- [ ] Protected API routes

### Step 5: Driver Features
- [ ] Driver onboarding & verification
- [ ] Driver availability toggle
- [ ] Ride acceptance/decline flow
- [ ] Earnings dashboard

### Step 6: Production Polish
- [ ] Docker containerization
- [ ] CI/CD pipeline
- [ ] Rate limiting
- [ ] API versioning
- [ ] Comprehensive testing

## Environment Variables

### Backend (.env)

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql+asyncpg://postgres:123@localhost:5432/uber_clone` |
| `FRONTEND_URL` | CORS allowed origin | `http://localhost:3000` |
| `DEBUG` | Enable debug mode | `true` |
| `ENVIRONMENT` | Environment name | `development` |

### Frontend (.env.local)

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | Yes |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Mapbox public token | Yes |

## Key Design Decisions

### 1. Single User Table with Role Enum
Both riders and drivers are stored in the `users` table with a `role` column. This simplifies the MVP and can be split later if needed.

### 2. Async SQLAlchemy
All database operations use SQLAlchemy's async API (`asyncpg` driver) for non-blocking I/O, essential for handling concurrent WebSocket connections in Step 2.

### 3. Modular Router Structure
Each feature (users, rides, payments) has its own router file mounted in `api/router.py`. This makes it easy to add new features without modifying existing code.

### 4. Viewport State Lifting
The map viewport state is lifted to the parent page component, allowing other UI elements (search, ride tracking) to programmatically control the map view.

### 5. Pydantic v2
Uses Pydantic v2's new `model_dump()` and `from_attributes` pattern for serialization, providing better performance than v1's `dict()` and `orm_mode`.

## Testing

### Backend Tests

```bash
cd backend
pytest
```

### Frontend Type Checking

```bash
cd frontend
npm run type-check
```

## License

MIT
