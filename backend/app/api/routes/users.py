"""
User API routes - CRUD operations for User model.

Provides endpoints for:
- Creating users (riders and drivers)
- Retrieving user profiles
- Updating user information
- Listing users (with pagination)

TODO Step 4: Add authentication-protected routes
TODO Step 4: Add password reset endpoints
TODO Step 2: Add driver location update endpoint
"""
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.core.logging import get_logger
from app.models.user import User, UserRole
from app.schemas.user import UserCreate, UserResponse, UserUpdate

logger = get_logger(__name__)
router = APIRouter(prefix="/users", tags=["users"])


@router.post(
    "",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new user",
    description="Register a new rider or driver account.",
)
async def create_user(
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db),
) -> User:
    """
    Create a new user (rider or driver).

    Args:
        user_data: User creation schema with name, email, phone, role
        db: Database session

    Returns:
        Created user object

    Raises:
        HTTPException 400: If email already exists
    """
    # Check if email already exists
    existing = await db.execute(
        select(User).where(User.email == user_data.email)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Email '{user_data.email}' is already registered",
        )

    # Create new user
    db_user = User(
        name=user_data.name,
        email=user_data.email,
        phone=user_data.phone,
        role=UserRole(user_data.role),
    )

    # TODO Step 4: Hash password if provided
    # if hasattr(user_data, 'password') and user_data.password:
    #     db_user.hashed_password = hash_password(user_data.password)

    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)

    logger.info(f"Created user: {db_user.id} ({db_user.email})")
    return db_user


@router.get(
    "",
    response_model=List[UserResponse],
    summary="List users",
    description="Get a paginated list of users with optional filtering.",
)
async def list_users(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=100, description="Max records to return"),
    role: str = Query(None, description="Filter by role: rider/driver/admin"),
    db: AsyncSession = Depends(get_db),
) -> List[User]:
    """
    List users with pagination and optional role filter.

    Args:
        skip: Pagination offset
        limit: Page size (max 100)
        role: Optional role filter
        db: Database session

    Returns:
        List of user objects
    """
    query = select(User)

    if role:
        query = query.where(User.role == UserRole(role))

    query = query.offset(skip).limit(limit).order_by(User.created_at.desc())

    result = await db.execute(query)
    return result.scalars().all()


@router.get(
    "/{user_id}",
    response_model=UserResponse,
    summary="Get user by ID",
    description="Retrieve a specific user's profile.",
)
async def get_user(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
) -> User:
    """
    Get a user by their UUID.

    Args:
        user_id: User's UUID
        db: Database session

    Returns:
        User object

    Raises:
        HTTPException 404: If user not found
    """
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_id} not found",
        )
    return user


@router.patch(
    "/{user_id}",
    response_model=UserResponse,
    summary="Update user",
    description="Update user profile information.",
)
async def update_user(
    user_id: UUID,
    user_data: UserUpdate,
    db: AsyncSession = Depends(get_db),
) -> User:
    """
    Update a user's profile (partial update).

    Args:
        user_id: User's UUID
        user_data: Fields to update
        db: Database session

    Returns:
        Updated user object

    Raises:
        HTTPException 404: If user not found
    """
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_id} not found",
        )

    # Update only provided fields
    update_data = user_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)

    await db.commit()
    await db.refresh(user)

    logger.info(f"Updated user: {user_id}")
    return user


@router.delete(
    "/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete user",
    description="Soft-delete a user account (sets is_active=False).",
)
async def delete_user(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
) -> None:
    """
    Soft-delete a user by setting is_active to False.

    Args:
        user_id: User's UUID
        db: Database session

    Raises:
        HTTPException 404: If user not found
    """
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_id} not found",
        )

    user.is_active = False
    await db.commit()

    logger.info(f"Soft-deleted user: {user_id}")


# TODO Step 2: Add driver location update endpoint
# @router.patch("/{user_id}/location")
# async def update_driver_location(
#     user_id: UUID,
#     lat: float,
#     lng: float,
#     db: AsyncSession = Depends(get_db),
# ):
#     """Update driver's current location (WebSocket fallback)."""
#     pass


# TODO Step 4: Add password change endpoint
# @router.post("/{user_id}/change-password")
# async def change_password(...):
#     pass
