# 📍 RouteWise 

RouteWise is a modern, high-performance website designed to demonstrate the complete ride-hailing lifecycle. Built with a robust backend using **FastAPI** and an interactive, real-time frontend using **Next.js** and **Mapbox**, RouteWise implements the core pillars of a ride-sharing service: user roles, geocoding and routing, payment pre-authorization, real-time driver tracking, and trip lifecycle management.

---

## 🚀 Key Features

*   👥 **User Management**: Dual-role support for Riders and Drivers using PostgreSQL & SQLAlchemy (Async).
*   🗺️ **Interactive Maps**: Real-time map rendering using Next.js and Mapbox GL with dynamic markers for pickup, dropoff, and active vehicles.
*   💳 **Pre-Authorized Payments**: Integrated Stripe Elements payment flows. Authorize the fare when requesting a ride, and capture it only upon successful completion.
*   📡 **Real-Time WebSockets**: Bidirectional updates streaming driver positions and trip phases from the backend.
*   🚗 **Driver Simulation & OTP**: Simulates driver routing en route to the pickup location and the trip to the destination. Security-verified trip starts via OTP.
*   🗄️ **Async Database Engine**: Fully asynchronous DB interactions using PostgreSQL, SQL Alchemy Async ORM, and Alembic migrations.

---

## 🛠️ Architecture Overview

The project is structured as a monorepo containing two decoupled systems:

```mermaid
graph TD
    subgraph Frontend [Next.js App]
        UI[Interactive UI & Destination Card]
        Map[Mapbox GL Map component]
        Stripe[Stripe React Elements]
        WS_Client[WebSocket Client]
    end

    subgraph Backend [FastAPI Service]
        API[FastAPI Router /api/v1]
        WS_Server[WebSocket Server /ws/ride]
        DB[(PostgreSQL / SQLAlchemy)]
        Payment[Stripe API Integration]
        Sim[Driver Simulator]
    end

    UI -->|1. Request Route & Fare| API
    UI -->|2. Authorize Payment| Stripe
    Stripe -->|3. Confirm Ride| API
    API -->|4. Trigger Simulator| Sim
    WS_Client <-->|5. Stream Location & Status| WS_Server
    API <--> DB
    Payment <--> API
```

---

## 📁 Repository Structure

```
RouteWise/
├── backend/
│   ├── app/
│   │   ├── api/            # API endpoints (health, users, rides, navigation, WebSockets)
│   │   ├── core/           # Configuration, logging, and settings
│   │   ├── db/             # SQLAlchemy connection & session management
│   │   ├── models/         # SQLAlchemy ORM models (User, Ride)
│   │   ├── schemas/        # Pydantic schemas for data validation
│   │   └── services/       # Business logic (simulators, external clients)
│   ├── alembic/            # Database migration scripts
│   ├── tests/              # Pytest test suite
│   ├── pyproject.toml      # Poetry configuration/metadata
│   └── requirements.txt    # Python dependencies
└── frontend/
    ├── app/                # Next.js app router pages & styles
    ├── components/         # Reusable React components (Map, DestinationCard, StripeForm)
    ├── lib/                # API helpers and client hooks
    ├── types/              # TypeScript declarations
    └── package.json        # Node.js dependencies
```

---

## 🚀 Getting Started

### Prerequisites
*   Python 3.10+
*   Node.js 18+
*   PostgreSQL database
*   Mapbox Access Token (free tier)
*   Stripe API Keys (test mode)

### 1. Backend Setup

1.  Navigate to the backend directory:
    ```bash
    cd backend
    ```
2.  Create and activate a virtual environment:
    ```bash
    python -m venv venv
    # Windows:
    .\venv\Scripts\activate
    # macOS/Linux:
    source venv/bin/activate
    ```
3.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```
4.  Configure environment variables in a `.env` file (see `.env.example`):
    ```env
    DATABASE_URL=postgresql+asyncpg://user:password@localhost/routewise
    MAPBOX_ACCESS_TOKEN=your_mapbox_token
    STRIPE_SECRET_KEY=your_stripe_secret_key
    ```
5.  Run database migrations:
    ```bash
    alembic upgrade head
    ```
6.  Start the FastAPI server:
    ```bash
    uvicorn app.main:app --reload
    ```

### 2. Frontend Setup

1.  Navigate to the frontend directory:
    ```bash
    cd ../frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Configure environment variables in a `.env.local` file:
    ```env
    NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=your_mapbox_token
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
    NEXT_PUBLIC_API_URL=http://localhost:8000
    ```
4.  Run the Next.js development server:
    ```bash
    npm run dev
    ```

---

## 🧪 Testing

Execute the backend test suite:
```bash
cd backend
pytest
```
