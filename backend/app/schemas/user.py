"""
Pydantic schemas for User model.

Defines request/response models for user CRUD operations.
Separate schemas for creation, update, and response to control data exposure.
"""
from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


class UserBase(BaseModel):
    """Base user schema with shared fields."""
    name: str = Field(..., min_length=1, max_length=100, description="Full name")
    email: EmailStr = Field(..., description="Email address")
    phone: Optional[str] = Field(None, max_length=20, description="Phone number")


class UserCreate(UserBase):
    """Schema for creating a new user."""
    role: str = Field(default="rider", pattern="^(rider|driver|admin)$")
    # TODO Step 4: Add password field
    # password: str = Field(..., min_length=8, max_length=100)


class UserUpdate(BaseModel):
    """Schema for updating user information (all fields optional)."""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=20)
    is_active: Optional[bool] = None
    # TODO Step 2: Add location update fields for drivers
    # current_lat: Optional[float] = None
    # current_lng: Optional[float] = None
    # is_online: Optional[bool] = None


class UserResponse(UserBase):
    """Schema for user responses (excludes sensitive data)."""
    id: UUID
    role: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        """Pydantic v2 config using from_attributes for ORM mode."""
        from_attributes = True


class UserInDB(UserResponse):
    """Schema with internal fields (for service layer use only)."""
    # TODO Step 4: Add hashed_password field
    # hashed_password: Optional[str] = None
    pass
