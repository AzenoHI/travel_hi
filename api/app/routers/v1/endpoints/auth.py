from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core.security import create_access_token
from app.db.database import get_session
from app.repositories.auth import authenticate_user
from app.schemas.token import Token

router = APIRouter(tags=["Authentication"])

# ---------------------------------------------------------
# 🔐 OAuth2 Login / Token Endpoint
# ---------------------------------------------------------

@router.post(
    "/token",
    response_model=Token,
    status_code=status.HTTP_200_OK,
    summary="Obtain access token via username and password (OAuth2)",
    response_description="JWT access token and token type (bearer)",
)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_session),
):
    """
    ### 🔐 Login and obtain access token

    Authenticates a user using **OAuth2 Password Flow** and returns a **JWT access token**
    that can be used to access protected endpoints.

    **Form Fields (application/x-www-form-urlencoded):**
    - `username`: registered username
    - `password`: user password

    **Authentication Flow:**
    1. User submits login form (username & password).
    2. The system verifies credentials via `authenticate_user`.
    3. On success, returns a JWT token signed by the server.
    4. Token must be included in the `Authorization: Bearer <token>` header
       when calling protected endpoints.

    **Example Request:**
    ```bash
    curl -X POST "http://localhost:8000/token" \\
      -H "Content-Type: application/x-www-form-urlencoded" \\
      -d "username=john&password=secret123"
    ```

    **Example Response:**
    ```json
    {
      "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "token_type": "bearer"
    }
    ```

    **Responses:**
    -  `200 OK`: Token successfully generated
    -  `401 Unauthorized`: Invalid username or password
    -  `500 Internal Server Error`: Token generation error or database failure

    **Usage Tip:**
    Use this endpoint in your frontend or API client to obtain a valid JWT token
    before calling endpoints that require authentication (e.g. `/incidents`, `/users/me`).
    """
    user = authenticate_user(form_data.username, form_data.password, db)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )

    access_token = create_access_token(data={"name": user.username})

    return {"access_token": access_token, "token_type": "bearer"}
