# models.py
from datetime import datetime, timezone
from enum import Enum
from sqlalchemy import (
    Enum as SAEnum,
    String,
    Integer,
    DateTime,
    Float,
    Text,
    Boolean,
    Index,
)
from sqlalchemy.orm import Mapped, mapped_column
from app.db.database import Base


class EventType(str, Enum):
    CONCERT = "CONCERT"
    HOLIDAY = "HOLIDAY"
    SPORT = "SPORT"
    STRIKE = "STRIKE"
    WEATHER = "WEATHER"
    OTHER = "OTHER"


class EventSeverity(int, Enum):
    LOW = 1
    MEDIUM = 2
    HIGH = 3


class Event(Base):
    __tablename__ = "events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text, default=None)

    event_type: Mapped[EventType] = mapped_column(
        SAEnum(EventType, name="event_type"),
        nullable=False,
        index=True,
    )
    severity: Mapped[EventSeverity] = mapped_column(
        SAEnum(EventSeverity, name="event_severity"),
        nullable=False,
        default=EventSeverity.MEDIUM,
    )

    starts_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        index=True,
    )
    ends_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        index=True,
    )

    lat: Mapped[float] = mapped_column(Float, nullable=False)
    lng: Mapped[float] = mapped_column(Float, nullable=False)
    radius_m: Mapped[int] = mapped_column(Integer, nullable=False, default=300)
    location_name: Mapped[str | None] = mapped_column(String(200), default=None)

    source: Mapped[str | None] = mapped_column(String(100), default=None)
    carrier: Mapped[str | None] = mapped_column(String(100), default=None)
    affected_lines: Mapped[str | None] = mapped_column(
        String(300), default=None
    )
    is_verified: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    __table_args__ = (
        Index("ix_events_time_window", "starts_at", "ends_at"),
        Index("ix_events_lat_lng", "lat", "lng"),
        Index("ix_events_type_start", "event_type", "starts_at"),
    )
