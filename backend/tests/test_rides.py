"""
Tests for the Ride API endpoints.

Covers:
- Requesting a ride
- Listing rides with filters
- Getting ride by ID
- Updating ride status through lifecycle
- Status transition validation
- Cancelling rides
"""
import pytest
from httpx import AsyncClient


class TestRideEndpoints:
    """Test suite for ride lifecycle operations."""

    async def create_test_user(
        self, test_client: AsyncClient, email: str = "rider@test.com"
    ) -> str:
        """Helper to create a test user and return their ID."""
        user_data = {
            "name": "Test Rider",
            "email": email,
            "phone": "+1-555-0199",
            "role": "rider",
        }
        response = await test_client.post("/api/v1/users", json=user_data)
        return response.json()["id"]

    async def test_request_ride(self, test_client: AsyncClient, sample_ride_data: dict):
        """Should create a new ride request."""
        response = await test_client.post("/api/v1/rides", json=sample_ride_data)
        assert response.status_code == 201

        data = response.json()
        assert data["status"] == "requested"
        assert data["pickup_lat"] == sample_ride_data["pickup"]["lat"]
        assert data["dropoff_lat"] == sample_ride_data["dropoff"]["lat"]
        assert "id" in data

    async def test_list_rides(self, test_client: AsyncClient, sample_ride_data: dict):
        """Should return a list of rides."""
        # Create a ride
        await test_client.post("/api/v1/rides", json=sample_ride_data)

        # List rides
        response = await test_client.get("/api/v1/rides")
        assert response.status_code == 200

        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1

    async def test_list_rides_with_status_filter(
        self, test_client: AsyncClient, sample_ride_data: dict
    ):
        """Should filter rides by status."""
        # Create a ride
        await test_client.post("/api/v1/rides", json=sample_ride_data)

        # Filter by status
        response = await test_client.get("/api/v1/rides?status=requested")
        data = response.json()
        assert all(ride["status"] == "requested" for ride in data)

    async def test_get_ride_by_id(
        self, test_client: AsyncClient, sample_ride_data: dict
    ):
        """Should retrieve a ride by ID."""
        # Create ride
        create_response = await test_client.post("/api/v1/rides", json=sample_ride_data)
        ride_id = create_response.json()["id"]

        # Get ride
        response = await test_client.get(f"/api/v1/rides/{ride_id}")
        assert response.status_code == 200

        data = response.json()
        assert data["id"] == ride_id
        assert data["status"] == "requested"

    async def test_get_ride_not_found(self, test_client: AsyncClient):
        """Should return 404 for non-existent ride."""
        fake_id = "00000000-0000-0000-0000-000000000000"
        response = await test_client.get(f"/api/v1/rides/{fake_id}")
        assert response.status_code == 404

    async def test_accept_ride(
        self, test_client: AsyncClient, sample_ride_data: dict
    ):
        """Should accept a ride and update status."""
        # Create ride
        create_response = await test_client.post("/api/v1/rides", json=sample_ride_data)
        ride_id = create_response.json()["id"]

        # Accept ride
        response = await test_client.post(f"/api/v1/rides/{ride_id}/accept")
        assert response.status_code == 200

        data = response.json()
        assert data["status"] == "accepted"
        assert data["accepted_at"] is not None

    async def test_update_ride_status_to_arrived(
        self, test_client: AsyncClient, sample_ride_data: dict
    ):
        """Should update ride status to arrived."""
        # Create and accept ride
        create_response = await test_client.post("/api/v1/rides", json=sample_ride_data)
        ride_id = create_response.json()["id"]
        await test_client.post(f"/api/v1/rides/{ride_id}/accept")

        # Update to arrived
        status_update = {"status": "arrived"}
        response = await test_client.patch(
            f"/api/v1/rides/{ride_id}/status", json=status_update
        )
        assert response.status_code == 200

        data = response.json()
        assert data["status"] == "arrived"
        assert data["arrived_at"] is not None

    async def test_complete_ride_lifecycle(
        self, test_client: AsyncClient, sample_ride_data: dict
    ):
        """Should complete full ride lifecycle: requested -> accepted -> arrived -> in_progress -> completed."""
        # Create ride
        response = await test_client.post("/api/v1/rides", json=sample_ride_data)
        ride_id = response.json()["id"]

        # Accept
        await test_client.post(f"/api/v1/rides/{ride_id}/accept")

        # Arrived
        await test_client.patch(
            f"/api/v1/rides/{ride_id}/status", json={"status": "arrived"}
        )

        # In progress
        await test_client.patch(
            f"/api/v1/rides/{ride_id}/status", json={"status": "in_progress"}
        )

        # Completed
        response = await test_client.patch(
            f"/api/v1/rides/{ride_id}/status", json={"status": "completed"}
        )
        assert response.status_code == 200

        data = response.json()
        assert data["status"] == "completed"
        assert data["completed_at"] is not None

    async def test_cancel_ride(
        self, test_client: AsyncClient, sample_ride_data: dict
    ):
        """Should cancel a ride."""
        # Create ride
        response = await test_client.post("/api/v1/rides", json=sample_ride_data)
        ride_id = response.json()["id"]

        # Cancel
        cancel_data = {
            "status": "cancelled",
            "cancelled_by": "rider",
            "reason": "Changed my mind",
        }
        response = await test_client.patch(
            f"/api/v1/rides/{ride_id}/status", json=cancel_data
        )
        assert response.status_code == 200

        data = response.json()
        assert data["status"] == "cancelled"
        assert data["cancelled_at"] is not None
        assert data["cancelled_by"] == "rider"
        assert data["cancellation_reason"] == "Changed my mind"

    async def test_invalid_status_transition(
        self, test_client: AsyncClient, sample_ride_data: dict
    ):
        """Should reject invalid status transitions."""
        # Create ride
        response = await test_client.post("/api/v1/rides", json=sample_ride_data)
        ride_id = response.json()["id"]

        # Try to complete without going through proper flow
        response = await test_client.patch(
            f"/api/v1/rides/{ride_id}/status", json={"status": "completed"}
        )
        assert response.status_code == 400
        assert "Invalid status transition" in response.json()["detail"]

    async def test_ride_status_filter(
        self, test_client: AsyncClient, sample_ride_data: dict
    ):
        """Should filter rides by multiple criteria."""
        # Create a ride
        await test_client.post("/api/v1/rides", json=sample_ride_data)

        # Filter by non-matching status
        response = await test_client.get("/api/v1/rides?status=completed")
        data = response.json()
        assert len(data) == 0

        # Filter by matching status
        response = await test_client.get("/api/v1/rides?status=requested")
        data = response.json()
        assert len(data) >= 1
