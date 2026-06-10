"""
Tests for the User API endpoints.

Covers:
- Creating users
- Listing users with pagination
- Getting user by ID
- Updating users
- Soft-deleting users
- Error handling for duplicate emails
"""
import pytest
from httpx import AsyncClient


class TestUserEndpoints:
    """Test suite for user CRUD operations."""

    async def test_create_user(self, test_client: AsyncClient, sample_user_data: dict):
        """Should create a new user successfully."""
        response = await test_client.post("/api/v1/users", json=sample_user_data)
        assert response.status_code == 201

        data = response.json()
        assert data["name"] == sample_user_data["name"]
        assert data["email"] == sample_user_data["email"]
        assert data["role"] == sample_user_data["role"]
        assert "id" in data
        assert "created_at" in data

    async def test_create_user_duplicate_email(
        self, test_client: AsyncClient, sample_user_data: dict
    ):
        """Should reject duplicate email addresses."""
        # Create first user
        response = await test_client.post("/api/v1/users", json=sample_user_data)
        assert response.status_code == 201

        # Try to create second user with same email
        response = await test_client.post("/api/v1/users", json=sample_user_data)
        assert response.status_code == 400
        assert "already registered" in response.json()["detail"]

    async def test_list_users(self, test_client: AsyncClient, sample_user_data: dict):
        """Should return a list of users."""
        # Create a user first
        await test_client.post("/api/v1/users", json=sample_user_data)

        # List users
        response = await test_client.get("/api/v1/users")
        assert response.status_code == 200

        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1

    async def test_list_users_with_pagination(
        self, test_client: AsyncClient, sample_user_data: dict
    ):
        """Should respect skip and limit parameters."""
        # Create multiple users
        for i in range(3):
            user_data = {**sample_user_data, "email": f"user{i}@test.com"}
            await test_client.post("/api/v1/users", json=user_data)

        # Test limit
        response = await test_client.get("/api/v1/users?limit=2")
        data = response.json()
        assert len(data) <= 2

    async def test_get_user_by_id(
        self, test_client: AsyncClient, sample_user_data: dict
    ):
        """Should retrieve a user by their ID."""
        # Create user
        create_response = await test_client.post("/api/v1/users", json=sample_user_data)
        created_user = create_response.json()
        user_id = created_user["id"]

        # Get user
        response = await test_client.get(f"/api/v1/users/{user_id}")
        assert response.status_code == 200

        data = response.json()
        assert data["id"] == user_id
        assert data["email"] == sample_user_data["email"]

    async def test_get_user_not_found(self, test_client: AsyncClient):
        """Should return 404 for non-existent user."""
        fake_id = "00000000-0000-0000-0000-000000000000"
        response = await test_client.get(f"/api/v1/users/{fake_id}")
        assert response.status_code == 404

    async def test_update_user(
        self, test_client: AsyncClient, sample_user_data: dict
    ):
        """Should update user information."""
        # Create user
        create_response = await test_client.post("/api/v1/users", json=sample_user_data)
        user_id = create_response.json()["id"]

        # Update user
        update_data = {"name": "Updated Name"}
        response = await test_client.patch(
            f"/api/v1/users/{user_id}", json=update_data
        )
        assert response.status_code == 200

        data = response.json()
        assert data["name"] == "Updated Name"
        assert data["email"] == sample_user_data["email"]  # Unchanged

    async def test_delete_user(
        self, test_client: AsyncClient, sample_user_data: dict
    ):
        """Should soft-delete a user."""
        # Create user
        create_response = await test_client.post("/api/v1/users", json=sample_user_data)
        user_id = create_response.json()["id"]

        # Delete user
        response = await test_client.delete(f"/api/v1/users/{user_id}")
        assert response.status_code == 204

        # Verify user is deactivated (soft delete)
        get_response = await test_client.get(f"/api/v1/users/{user_id}")
        user_data = get_response.json()
        assert user_data["is_active"] is False

    async def test_create_user_invalid_role(
        self, test_client: AsyncClient, sample_user_data: dict
    ):
        """Should reject invalid role values."""
        invalid_data = {**sample_user_data, "role": "invalid_role"}
        response = await test_client.post("/api/v1/users", json=invalid_data)
        assert response.status_code == 422  # Validation error
