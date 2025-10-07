from datetime import datetime
import asyncio
from fastapi import (
    APIRouter,
    Depends,
    UploadFile,
    File,
    Form,
    Request,
    HTTPException,
    Query,
)
from pydantic import ValidationError
from sqlalchemy.orm import Session
from app.db.database import get_session
from app.repositories.report import ReportRepository
from app.services.report import ReportService
from app.schemas.report import ReportRead, ReportType, Location, ReportList
from app.utils.images import validate_and_store_image
from app.schemas.traffic import TrafficReport
from app.utils.llm import assess_disruption
from app.services.ws_manager import manager
from app.utils.moderation import moderate_text
from app.core.security import oauth2_scheme
from app.repositories.auth import authenticate_user
from app.schemas.user import User
from app.core.rbac import get_current_active_user, get_current_user

router = APIRouter()


def get_service(session: Session = Depends(get_session)) -> ReportService:
    return ReportService(ReportRepository(session))


@router.post(
    "/incidents",
    response_model=ReportRead,
    status_code=201,
    summary="Create a new incident report",
    response_description="Created incident report data"
)
async def create_report(
    request: Request,
    type: ReportType = Form(..., description="Type of incident (e.g. accident, delay, blockage)"),
    lat: float = Form(..., description="Latitude of the incident location (-90 to 90)"),
    lng: float = Form(..., description="Longitude of the incident location (-180 to 180)"),
    name: str | None = Form(None, description="Optional report title or short name"),
    description: str | None = Form(None, description="Detailed description of the incident"),
    photo: UploadFile | None = File(default=None, description="Optional photo file of the incident"),
    svc: ReportService = Depends(get_service),
    token: str = Depends(oauth2_scheme),
    db=Depends(get_session),
):
    """
    ### 🧾 Create a new incident report

    This endpoint allows **authenticated or anonymous users** to create a new traffic incident report.
    Reports include type, location, optional title, description, and photo.

    - If a token is provided, the report will be linked to that user.
    - All text fields are moderated automatically.
    - A background task broadcasts the event to connected WebSocket clients in real-time.

    **Validation:**
    - Latitude must be between `-90` and `90`
    - Longitude must be between `-180` and `180`

    **Returns:**
    Newly created report object with metadata and optional photo URL.

    **Example Request:**
    ```
    type=accident
    lat=50.0614
    lng=19.9366
    description=Car accident near Kraków main station
    ```

    **Responses:**
    -  `201 Created`: Successfully created a report
    -  `400 Bad Request`: Inappropriate content detected
    -  `422 Unprocessable Entity`: Invalid coordinates
    """
    try:
        Location(lat=lat, lng=lng)
    except ValidationError:
        raise HTTPException(
            status_code=422,
            detail="Invalid coordinates. Latitude must be between -90 and 90, longitude between -180 and 180.",
        )

    user = None
    if token:
        try:
            user = await get_current_user(token=token, db=db)
            print("✅ Authenticated user:", user.username)
        except HTTPException:
            user = None

    if description:
        moderate_description = moderate_text(description)
        if moderate_description is False:
            raise HTTPException(
                status_code=400,
                detail="Description contains inappropriate content.",
            )

    if name:
        moderate_name = moderate_text(name)
        if moderate_name is False:
            raise HTTPException(
                status_code=400,
                detail="Name contains inappropriate content.",
            )

    photo_name = validate_and_store_image(photo) if photo and photo.filename else None

    obj = svc.create(
        type_=type,
        lat=lat,
        lng=lng,
        name=name,
        description=description,
        photo_path=photo_name,
    )

    base = str(request.base_url).rstrip("/")
    result = ReportRead.from_orm_with_photo(obj, base_url=base)

    broadcast_data = {
        "user": "Anonim",
        "message": description or name or "Nowe zgłoszenie",
        "lat": lat,
        "lng": lng,
        "likes": obj.likes,
        "timestamp": datetime.utcnow().isoformat() + "Z",
    }

    asyncio.create_task(manager.broadcast(broadcast_data))

    return result


@router.get(
    "/incidents/{incident_id}",
    response_model=ReportRead,
    status_code=200,
    summary="Retrieve a single incident by ID",
    response_description="Incident details with location and photo"
)
def get_report(
    incident_id: int,
    request: Request,
    svc: ReportService = Depends(get_service),
):
    """
    ### 🔍 Retrieve a single incident by its ID

    Returns full information about a single incident report including:
    - location (latitude & longitude)
    - description
    - photo URL (if attached)
    - likes, confirmations, and denials counters

    **Path Parameter:**
    - `incident_id` — integer ID of the incident

    **Responses:**
    -  `200 OK`: Incident found
    -  `404 Not Found`: Report with given ID does not exist
    """
    obj = svc.get(incident_id)
    if not obj:
        raise HTTPException(status_code=404, detail=f"Report with id={incident_id} not found")
    base = str(request.base_url).rstrip("/")
    return ReportRead.from_orm_with_photo(obj, base_url=base)


@router.get(
    "/incidents",
    response_model=ReportList,
    status_code=200,
    summary="List incidents near a given location",
    response_description="Paginated list of nearby incidents"
)
def list_reports(
    request: Request,
    lat: float = Query(0, ge=-90, le=90, description="Latitude of user's current position"),
    lng: float = Query(0, ge=-180, le=180, description="Longitude of user's current position"),
    radius: float = Query(5000.0, gt=0, le=50000, description="Search radius in meters (default 5000)"),
    skip: int = Query(0, ge=0, description="Number of records to skip for pagination"),
    limit: int = Query(50, le=200, description="Maximum number of records to return"),
    svc: ReportService = Depends(get_service),
):
    """
    ### 🌍 List nearby incidents

    Returns all incident reports within a specified radius of the given coordinates.
    Supports pagination and filtering by distance.

    **Query Parameters:**
    - `lat`, `lng` — reference coordinates
    - `radius` — search radius in meters (default 5000)
    - `skip` and `limit` — pagination controls

    **Responses:**
    -  `200 OK`: List of incidents with total count
    """
    items, total = svc.list_in_radius(lat=lat, lng=lng, radius_km=radius, skip=skip, limit=limit)
    base = str(request.base_url).rstrip("/")
    reports = [ReportRead.from_orm_with_photo(obj, base_url=base) for obj in items]
    return ReportList(items=reports, total=total)


@router.post(
    "/incidents/{incident_id}/like",
    response_model=ReportRead,
    summary="Add a like to an incident",
    response_description="Updated report with incremented like counter"
)
def like_report(
    incident_id: int,
    request: Request,
    svc: ReportService = Depends(get_service),
):
    """
    ### 👍 Like an incident

    Increments the like counter for the specified incident.
    Used by users to confirm appreciation or agreement.

    **Path Parameter:**
    - `incident_id`: integer ID of the report to like

    **Responses:**
    -  `200 OK`: Like added successfully
    -  `404 Not Found`: Report not found
    """
    obj = svc.increment_counter(incident_id, "likes")
    if not obj:
        raise HTTPException(status_code=404, detail=f"Report with id={incident_id} not found")
    base = str(request.base_url).rstrip("/")
    return ReportRead.from_orm_with_photo(obj, base_url=base)


@router.post(
    "/incidents/{incident_id}/confirm",
    response_model=ReportRead,
    summary="Confirm incident validity",
    response_description="Updated report with confirmation count"
)
def confirm_report(
    incident_id: int,
    request: Request,
    svc: ReportService = Depends(get_service),
):
    """
    ### ✅ Confirm incident validity

    Increments the confirmation counter for the selected report.
    Used when multiple users verify that the incident is real and still relevant.

    **Responses:**
    -  `200 OK`: Confirmation added
    -  `404 Not Found`: Report not found
    """
    obj = svc.increment_counter(incident_id, "confirmations")
    if not obj:
        raise HTTPException(status_code=404, detail=f"Report with id={incident_id} not found")
    base = str(request.base_url).rstrip("/")
    return ReportRead.from_orm_with_photo(obj, base_url=base)


@router.post(
    "/incidents/{incident_id}/deny",
    response_model=ReportRead,
    summary="Deny or mark incident as invalid",
    response_description="Updated report with denial counter incremented"
)
def deny_report(
    incident_id: int,
    request: Request,
    svc: ReportService = Depends(get_service),
):
    """
    ###  Deny incident validity

    Marks an incident as **invalid** or outdated.
    Increments the denial counter, helping to filter unreliable reports.

    **Responses:**
    -  `200 OK`: Denial registered
    -  `404 Not Found`: Report not found
    """
    obj = svc.increment_counter(incident_id, "denials")
    if not obj:
        raise HTTPException(status_code=404, detail=f"Report with id={incident_id} not found")
    base = str(request.base_url).rstrip("/")
    return ReportRead.from_orm_with_photo(obj, base_url=base)
