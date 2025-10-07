from app.db.models import Event
from app.db.models.event import EventType, EventSeverity
from app.schemas.event import EventCreate, EventRead
from datetime import date, timezone, datetime
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.database import get_session
from app.repositories.event import list_events_on_day, list_events_around

router = APIRouter(prefix="")

# ---------------------------------------------------------
# 🆕 Create Event
# ---------------------------------------------------------

@router.post(
    "/",
    response_model=EventRead,
    summary="Create a new event",
    response_description="Returns the created event with assigned ID and timestamps",
)
def create_event(payload: EventCreate, db: Session = Depends(get_session)):
    """
    ### 🆕 Create a new event

    Creates a new event record in the database.

    **Request Body:**
    - `type` — event type (e.g., ACCIDENT, DELAY, BLOCKAGE)
    - `severity` — severity level (LOW, MEDIUM, HIGH)
    - `description` — optional text describing the event
    - `lat`, `lng` — geographical coordinates
    - `is_verified` — optional flag for verified events

    **Responses:**
    -  `201 Created`: Event successfully created
    -  `422 Unprocessable Entity`: Invalid data format

    **Example Request:**
    ```json
    {
      "type": "ACCIDENT",
      "severity": "HIGH",
      "description": "Major collision on A4 near Kraków",
      "lat": 50.0614,
      "lng": 19.9373,
      "is_verified": true
    }
    ```
    """
    evt = Event(**payload.model_dump())
    db.add(evt)
    db.commit()
    db.refresh(evt)
    return evt

# ---------------------------------------------------------
# 📋 List All Events
# ---------------------------------------------------------

@router.get(
    "/",
    response_model=list[EventRead],
    summary="List all events",
    response_description="Returns all events currently stored in the database",
)
def list_events(db: Session = Depends(get_session)):
    """
    ### 📋 List all events

    Returns a list of **all registered events** in the database.

    This endpoint is mostly used for **testing and administrative** purposes.

    **Responses:**
    -  `200 OK`: List of events
    -  `204 No Content`: No events found
    """
    return db.query(Event).all()

# ---------------------------------------------------------
# 📅 Events by Day
# ---------------------------------------------------------

@router.get(
    "/by-day",
    response_model=list[EventRead],
    summary="List events for a specific day",
    response_description="Returns all events that occurred on the specified date (UTC)",
)
def events_by_day(
    day: date = Query(..., description="Date in format YYYY-MM-DD (UTC)"),
    session: Session = Depends(get_session),
):
    """
    ### 📅 Get events by day

    Retrieves all events recorded on a given calendar day (UTC timezone).

    **Query Parameter:**
    - `day`: date string (YYYY-MM-DD)

    **Responses:**
    -  `200 OK`: Events found for the given day
    -  `204 No Content`: No events recorded on this date

    **Example Request:**
    ```
    GET /events/by-day?day=2025-10-05
    ```
    """
    return list_events_on_day(session, day, tz=timezone.utc)

# ---------------------------------------------------------
# 🕓 Events Around Time
# ---------------------------------------------------------

@router.get(
    "/around",
    response_model=list[EventRead],
    summary="List events around a specific time",
    response_description="Returns events occurring near a given timestamp (± hours window)",
)
def events_around_time(
    at: datetime = Query(..., description="Reference time in ISO 8601 format, e.g. 2025-10-04T12:00:00Z"),
    threshold_hours: int = Query(3, ge=1, le=24, description="Time window ± hours around 'at' timestamp"),
    event_type: EventType | None = Query(None, description="Filter by event type"),
    severity: EventSeverity | None = Query(None, description="Filter by event severity"),
    is_verified: bool | None = Query(None, description="Filter verified/unverified events"),
    limit: int = Query(200, ge=1, le=1000, description="Maximum number of events to return"),
    offset: int = Query(0, ge=0, description="Pagination offset"),
    session: Session = Depends(get_session),
):
    """
    ### 🕓 Get events around a specific time

    Returns events that happened **close to a given datetime**, within a configurable ± hour window.

    This is useful for **real-time dashboards**, **timeline analyses**, or **incident clustering**.

    **Query Parameters:**
    - `at` — reference time (ISO 8601)
    - `threshold_hours` — window size in hours (default: 3)
    - `event_type` — optional filter by type (e.g. `ACCIDENT`, `BLOCKAGE`)
    - `severity` — optional filter by severity (e.g. `HIGH`)
    - `is_verified` — optional filter for verified events
    - `limit` — maximum number of results
    - `offset` — pagination offset

    **Example Request:**
    ```
    GET /events/around?at=2025-10-05T09:00:00Z&threshold_hours=2&event_type=ACCIDENT
    ```

    **Responses:**
    -  `200 OK`: Events found
    -  `204 No Content`: No matching events found
    """
    return list_events_around(
        session,
        at,
        threshold_hours=threshold_hours,
        event_type=event_type,
        severity=severity,
        is_verified=is_verified,
        limit=limit,
        offset=offset,
    )
