from app.db.models import Event
from app.db.models.event import EventType, EventSeverity
from app.schemas.event import EventCreate, EventRead
from datetime import date, timezone, datetime
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.database import get_session
from app.repositories.event import list_events_on_day, list_events_around
from app.schemas.event import EventRead

router = APIRouter(prefix="")


@router.post("/", response_model=EventRead)
def create_event(payload: EventCreate, db: Session = Depends(get_session)):
    evt = Event(**payload.model_dump())
    db.add(evt)
    db.commit()
    db.refresh(evt)
    return evt


@router.get("/", response_model=list[EventRead])
def list_events(db: Session = Depends(get_session)):
    return db.query(Event).all()


@router.get("/by-day", response_model=list[EventRead])
def events_by_day(
        day: date = Query(..., description="YYYY-MM-DD"),
        session: Session = Depends(get_session),
):
    return list_events_on_day(session, day, tz=timezone.utc)


@router.get("/around", response_model=list[EventRead])
def events_around_time(
        at: datetime = Query(..., description="Czas odniesienia (ISO 8601, np. 2025-10-04T12:00:00Z)"),
        threshold_hours: int = Query(3, ge=1, le=24, description="Okno w godzinach po obu stronach (±)"),
        event_type: EventType | None = Query(None),
        severity: EventSeverity | None = Query(None),
        is_verified: bool | None = Query(None),
        limit: int = Query(200, ge=1, le=1000),
        offset: int = Query(0, ge=0),
        session: Session = Depends(get_session),
):
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
