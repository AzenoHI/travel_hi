from datetime import datetime
from pydantic import BaseModel, Field, field_validator
from app.db.models.event import EventType, EventSeverity


class EventBase(BaseModel):
    name: str = Field(..., max_length=200, description="Nazwa zdarzenia")
    description: str | None = Field(None, description="Opis zdarzenia")
    event_type: EventType
    severity: EventSeverity = EventSeverity.MEDIUM

    starts_at: datetime
    ends_at: datetime

    lat: float
    lng: float
    radius_m: int = Field(300, description="Promień oddziaływania w metrach")
    location_name: str | None = None

    source: str | None = None
    carrier: str | None = None
    affected_lines: str | None = Field(
        None, description="Lista linii jako string (np. '52,A,D')"
    )
    is_verified: bool = False

    @classmethod
    @field_validator("ends_at")
    def validate_time(cls, v: datetime, values: dict) -> datetime:
        if "starts_at" in values and v <= values["starts_at"]:
            raise ValueError("ends_at must be greater than starts_at")
        return v


class EventCreate(EventBase):
    pass


class EventUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    event_type: EventType | None = None
    severity: EventSeverity | None = None

    starts_at: datetime | None = None
    ends_at: datetime | None = None

    lat: float | None = None
    lng: float | None = None
    radius_m: int | None = None
    location_name: str | None = None

    source: str | None = None
    carrier: str | None = None
    affected_lines: str | None = None
    is_verified: bool | None = None


class EventRead(EventBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True