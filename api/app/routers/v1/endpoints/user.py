from fastapi import (
    APIRouter,
    HTTPException,
    status,
    Path,
    Depends,
    Query,
)
from sqlalchemy.orm import Session
from typing import Annotated

from app.db.database import get_session
from app.core.rbac import (
    get_current_active_user,
    has_permission,
    require_permission,
)
from app.repositories.user import (
    get_user_by_username,
    get_user_by_email,
    create_user,
    update_user,
    get_all_users,
    update_user_role,
    get_user_by_id,
    update_user_status,
    add_user_permission,
    remove_user_permission,
    delete_user,
)
from app.schemas.user import User, UserCreate, UserUpdate, Permission, Role

router = APIRouter()

# ---------------------------------------------------------
# 🧩 Register user
# ---------------------------------------------------------

@router.post(
    "/user",
    response_model=User,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user account",
    response_description="Created user data including assigned role and permissions",
)
async def register_user(user: UserCreate, db: Session = Depends(get_session)) -> User:
    """
    ### 🪪 Register a new user

    Creates a new user account with username, email, and password.

    **Validations**
    - Usernames and emails must be unique.
    - Email format is validated by schema.

    **Request Body:**
    - `username` — unique username
    - `email` — user email
    - `password` — plaintext password (hashed before saving)

    **Responses**
    -  `201 Created`: Successfully registered
    -  `400 Bad Request`: Username or email already exists
    """
    existing_user = get_user_by_username(user.username, db)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Username already exists"
        )

    existing_email = get_user_by_email(user.email, db)
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Email already exists."
        )

    return create_user(user, db)

# ---------------------------------------------------------
# 👤 Current user info
# ---------------------------------------------------------

@router.get(
    "/me",
    response_model=User,
    summary="Get current authenticated user",
    response_description="Returns information about the currently logged-in user",
)
async def read_user(current_user: User = Depends(get_current_active_user)) -> User:
    """
    ### 👤 Get current authenticated user

    Returns the full profile of the user whose token is used for authentication.

    **Responses**
    -  `200 OK`: Returns current user data
    -  `401 Unauthorized`: Missing or invalid token
    """
    return current_user

# ---------------------------------------------------------
# ✏️ Update user details
# ---------------------------------------------------------

@router.patch(
    "/{user_id}",
    response_model=User,
    summary="Update user details",
    response_description="Updated user profile data",
)
async def update_user_details(
    user_update: UserUpdate,
    user_id: str = Path(..., title="The ID of the user to update."),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_session),
):
    """
    ### ✏️ Update user details

    Allows a user to modify their own data, or an admin with `UPDATE_USER` permission
    to modify another user's profile.

    **Validations**
    - Only self or users with permission can perform this action.

    **Responses**
    -  `200 OK`: Successfully updated
    -  `403 Forbidden`: Not enough permissions
    -  `404 Not Found`: User not found
    """
    if str(current_user.id) != user_id and not has_permission(current_user, Permission.UPDATE_USER):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to update this user"
        )

    try:
        updated_user = update_user(int(user_id), user_update, db)
        if not updated_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
            )
        return updated_user
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

# ---------------------------------------------------------
# 📜 List all users
# ---------------------------------------------------------

@router.get(
    "/",
    response_model=list[User],
    dependencies=[Depends(require_permission(Permission.READ_USER))],
    summary="List all users",
    response_description="Paginated list of all registered users",
)
async def read_users(
    skip: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=100)] = 10,
    db: Session = Depends(get_session),
):
    """
    ### 📜 Get all users

    Returns a paginated list of all users.
    Requires `READ_USER` permission.

    **Query Parameters**
    - `skip` — offset (for pagination)
    - `limit` — number of users to return (default 10)

    **Responses**
    -  `200 OK`: List of users
    -  `403 Forbidden`: Insufficient permissions
    """
    return get_all_users(db, skip, limit)

# ---------------------------------------------------------
# 🧭 Update user role
# ---------------------------------------------------------

@router.patch(
    "/{user_id}/role",
    response_model=User,
    dependencies=[Depends(require_permission(Permission.MANAGE_ROLES))],
    summary="Update a user's role",
    response_description="User data with updated role",
)
async def update_role(
    role: Role,
    user_id: str = Path(..., title="The ID of the user to update."),
    db: Session = Depends(get_session),
):
    """
    ### 🧭 Update user role

    Allows an admin to change a user's role.
    Requires `MANAGE_ROLES` permission.

    **Request Body**
    - `role`: new role value (`ADMIN`, `MODERATOR`, `USER`, etc.)

    **Responses**
    -  `200 OK`: Role updated
    -  `404 Not Found`: User not found
    """
    user = update_user_role(int(user_id), role, db)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )
    return user

# ---------------------------------------------------------
# 🔎 Get user by ID
# ---------------------------------------------------------

@router.get(
    "/{user_id}",
    response_model=User,
    dependencies=[Depends(require_permission(Permission.READ_USER))],
    summary="Get user by ID",
    response_description="User details by ID",
)
async def read_user(
    user_id: str = Path(..., title="The ID of the user to get."),
    db: Session = Depends(get_session),
):
    """
    ### 🔎 Get a specific user by ID

    Fetches user details for a given `user_id`.
    Requires `READ_USER` permission.

    **Responses**
    -  `200 OK`: User found
    -  `404 Not Found`: User does not exist
    """
    user = get_user_by_id(int(user_id), db)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    return user

# ---------------------------------------------------------
# 🟢 Enable / Disable user
# ---------------------------------------------------------

@router.patch(
    "/{user_id}/status",
    response_model=User,
    dependencies=[Depends(require_permission(Permission.MANAGE_ROLES))],
    summary="Enable or disable a user",
    response_description="User with updated status",
)
async def update_user_status_endpoint(
    disabled: bool,
    user_id: str = Path(..., title="The ID of the user to update."),
    db: Session = Depends(get_session),
):
    """
    ### 🟢 Enable or disable a user

    Updates the `disabled` status of a user account.
    Requires `MANAGE_ROLES` permission.

    **Query Parameter**
    - `disabled=true|false`

    **Responses**
    -  `200 OK`: Status updated
    -  `404 Not Found`: User not found
    """
    updated = update_user_status(int(user_id), disabled, db)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    user = get_user_by_id(int(user_id), db)
    return user

# ---------------------------------------------------------
# ➕ Add permission
# ---------------------------------------------------------

@router.post(
    "/{user_id}/permissions/add",
    response_model=User,
    dependencies=[Depends(require_permission(Permission.MANAGE_ROLES))],
    summary="Add a permission to a user",
    response_description="User with updated permissions",
)
async def add_permission(
    permission: Permission,
    user_id: str = Path(..., title="The ID of the user to update."),
    db: Session = Depends(get_session),
):
    """
    ### ➕ Add permission to user

    Grants a new permission to a specific user.
    Requires `MANAGE_ROLES` permission.

    **Request Body**
    - `permission`: value from the `Permission` enum

    **Responses**
    -  `200 OK`: Permission added
    -  `404 Not Found`: User not found
    """
    user = add_user_permission(user_id, permission, db)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )
    return user

# ---------------------------------------------------------
# ➖ Remove permission
# ---------------------------------------------------------

@router.post(
    "/{user_id}/permissions/remove",
    response_model=User,
    dependencies=[Depends(require_permission(Permission.MANAGE_ROLES))],
    summary="Remove a permission from user",
    response_description="User with updated permissions",
)
async def remove_permission(
    permission: Permission,
    user_id: str = Path(..., title="The ID of the user to update."),
    db: Session = Depends(get_session),
):
    """
    ### ➖ Remove permission from user

    Revokes an existing permission from the given user.
    Requires `MANAGE_ROLES` permission.

    **Request Body**
    - `permission`: value from the `Permission` enum

    **Responses**
    -  `200 OK`: Permission removed
    -  `404 Not Found`: User not found
    """
    user = remove_user_permission(int(user_id), permission, db)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )
    return user

# ---------------------------------------------------------
# 🗑️ Delete user
# ---------------------------------------------------------

@router.delete(
    "/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a user account",
    response_description="No content — user deleted",
)
async def delete_user_endpoint(
    user_id: str = Path(..., title="The ID of the user to delete."),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_session),
):
    """
    ### 🗑️ Delete a user account

    Permanently removes a user record from the database.
    Allowed for:
    - The user themselves, or
    - Users with `UPDATE_USER` permission

    **Responses**
    -  `204 No Content`: User deleted
    -  `403 Forbidden`: Not enough permissions
    -  `404 Not Found`: User not found
    """
    if str(current_user.id) != user_id and not has_permission(current_user, Permission.UPDATE_USER):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to update this user"
        )
    deleted = delete_user(int(user_id), db)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )
    return None
