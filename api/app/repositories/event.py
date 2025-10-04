from datetime import date, datetime, timedelta, timezone

from sqlalchemy import and_, select
from sqlalchemy.orm import Session

from app.db.models.event import Event, EventType, EventSeverity


def _day_window(day: date, tz: timezone = timezone.utc) -> tuple[datetime, datetime]:
    start = datetime.combine(day, datetime.min.time(), tzinfo=tz)
    end = start + timedelta(days=1) - timedelta(microseconds=1)
    return start, end


def list_events_between(
        session: Session,
        window_start: datetime,
        window_end: datetime,
        *,
        event_type: EventType | None = None,
        severity: EventSeverity | None = None,
        is_verified: bool | None = None,
        limit: int = 500,
        offset: int = 0,
) -> list[Event]:
    if window_end < window_start:
        raise ValueError("window_end must be >= window_start")

    conditions: list = [
        Event.starts_at <= window_end,
        Event.ends_at >= window_start,
    ]
    if event_type is not None:
        conditions.append(Event.event_type == event_type)
    if severity is not None:
        conditions.append(Event.severity == severity)
    if is_verified is not None:
        conditions.append(Event.is_verified == is_verified)

    stmt = (
        select(Event)
        .where(and_(*conditions))
        .order_by(Event.starts_at.asc())
        .limit(limit)
        .offset(offset)
    )
    return list(session.execute(stmt).scalars().all())


def list_events_on_day(
        session: Session,
        day: date,
        *,
        tz: timezone = timezone.utc,
        event_type: EventType | None = None,
        severity: EventSeverity | None = None,
        is_verified: bool | None = None,
        limit: int = 500,
        offset: int = 0,
) -> list[Event]:
    day_start, day_end = _day_window(day, tz=tz)
    return list_events_between(
        session,
        day_start,
        day_end,
        event_type=event_type,
        severity=severity,
        is_verified=is_verified,
        limit=limit,
        offset=offset,
    )


def list_events_around(
        session: Session,
        at: datetime,
        *,
        threshold_hours: int = 3,
        event_type: EventType | None = None,
        severity: EventSeverity | None = None,
        is_verified: bool | None = None,
        limit: int = 500,
        offset: int = 0,
) -> list[Event]:
    if at.tzinfo is None:
        at = at.replace(tzinfo=timezone.utc)

    window_start = at - timedelta(hours=threshold_hours)
    window_end = at + timedelta(hours=threshold_hours)

    conditions = [
        Event.starts_at <= window_end,
        Event.ends_at >= window_start,
    ]
    if event_type is not None:
        conditions.append(Event.event_type == event_type)
    if severity is not None:
        conditions.append(Event.severity == severity)
    if is_verified is not None:
        conditions.append(Event.is_verified == is_verified)

    stmt = (
        select(Event)
        .where(and_(*conditions))
        .order_by(Event.starts_at.asc())
        .limit(limit)
        .offset(offset)
    )
    return list(session.execute(stmt).scalars().all())
