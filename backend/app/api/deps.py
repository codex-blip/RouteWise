"""
FastAPI dependencies shared across API routers.

Provides common dependencies like database sessions, authentication,
and current user extraction for protected routes.

TODO Step 4: Add OAuth2/JWT authentication dependencies:
    - get_current_user(): Extract user from JWT token
    - get_current_driver(): Ensure user is a driver
    - get_current_rider(): Ensure user is a rider
    - require_admin(): Admin-only access control
"""
from fastapi import Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.base import get_db

# Re-export get_db for convenience
__all__ = ["get_db", "get_current_user"]


# TODO Step 4: Implement JWT authentication
# from fastapi.security import OAuth2PasswordBearer
# from jose import JWTError, jwt
# from app.core.config import get_settings
#
# oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/login")


async def get_current_user(
    db: AsyncSession = Depends(get_db),
    # TODO Step 4: Add token parameter
    # token: str = Depends(oauth2_scheme)
) -> dict:
    """
    Get the currently authenticated user.

    TODO Step 4: Replace with actual JWT token validation:
        1. Decode JWT token
        2. Extract user_id from token payload
        3. Query database for user
        4. Return user object or raise 401

    For now, returns a mock user for development.
    """
    # TODO Step 4: Implement real authentication
    # credentials_exception = HTTPException(
    #     status_code=status.HTTP_401_UNAUTHORIZED,
    #     detail="Could not validate credentials",
    #     headers={"WWW-Authenticate": "Bearer"},
    # )
    # try:
    #     payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    #     user_id: str = payload.get("sub")
    #     if user_id is None:
    #         raise credentials_exception
    # except JWTError:
    #     raise credentials_exception
    #
    # user = await db.get(User, UUID(user_id))
    # if user is None:
    #     raise credentials_exception
    # return user

    # Placeholder: return mock user for development
    return {"id": "mock-user-id", "role": "rider", "name": "Mock User"}


# TODO Step 4: Role-based access control dependencies
# async def get_current_driver(
#     current_user: dict = Depends(get_current_user)
# ) -> dict:
#     """Ensure current user is a driver."""
#     if current_user.get("role") != "driver":
#         raise HTTPException(
#             status_code=status.HTTP_403_FORBIDDEN,
#             detail="Driver access required"
#         )
#     return current_user
#
# async def get_current_rider(
#     current_user: dict = Depends(get_current_user)
# ) -> dict:
#     """Ensure current user is a rider."""
#     if current_user.get("role") != "rider":
#         raise HTTPException(
#             status_code=status.HTTP_403_FORBIDDEN,
#             detail="Rider access required"
#         )
#     return current_user
