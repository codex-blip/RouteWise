"""
Tests for the health check endpoints.

Covers:
- Basic health check with database connectivity
- Simple ping endpoint
- Response schema validation
"""
import pytest
from httpx import AsyncClient


class TestHealthEndpoints:
    """Test suite for health check endpoints."""

    async def test_health_check_returns_200(self, test_client: AsyncClient):
        """Health endpoint should return 200 OK."""
        response = await test_client.get("/api/v1/health")
        assert response.status_code == 200

    async def test_health_check_has_required_fields(self, test_client: AsyncClient):
        """Health response should contain all required fields."""
        response = await test_client.get("/api/v1/health")
        data = response.json()

        assert "status" in data
        assert "timestamp" in data
        assert "environment" in data
        assert "version" in data
        assert "services" in data

    async def test_health_check_status_values(self, test_client: AsyncClient):
        """Status should be either 'healthy' or 'degraded'."""
        response = await test_client.get("/api/v1/health")
        data = response.json()

        assert data["status"] in ["healthy", "degraded"]

    async def test_health_check_services(self, test_client: AsyncClient):
        """Services should report database and server status."""
        response = await test_client.get("/api/v1/health")
        data = response.json()

        services = data["services"]
        assert "database" in services
        assert "server" in services
        assert services["server"] == "running"
        assert services["database"] in ["connected", "disconnected"]

    async def test_ping_returns_200(self, test_client: AsyncClient):
        """Ping endpoint should return 200 OK."""
        response = await test_client.get("/api/v1/health/ping")
        assert response.status_code == 200

    async def test_ping_returns_status_ok(self, test_client: AsyncClient):
        """Ping should return simple status: ok."""
        response = await test_client.get("/api/v1/health/ping")
        data = response.json()

        assert data == {"status": "ok"}
