from pydantic import BaseModel, Field, ConfigDict
from enum import Enum


class ReportType(str, Enum):
    ACCIDENT = "accident"
    ROADWORK = "roadwork"
    CLOSURE = "closure"
    POLICE = "police"
    OTHER = "other"


class Location(BaseModel):
    lat: float = Field(..., ge=-90, le=90)
    lng: float = Field(..., ge=-180, le=180)


class ReportCreate(BaseModel):
    type: ReportType
    location: Location


class ReportRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    type: ReportType
    location: Location
    photo_url: str | None
    created_at: str

    @classmethod
    def from_orm_with_photo(cls, obj, base_url: str | None = None):
        loc = Location(lat=obj.latitude, lng=obj.longitude)
        url = None
        if obj.photo_path and base_url:
            url = f"{base_url}/files/{obj.photo_path.split('/')[-1]}"
        return cls(id=obj.id, type=obj.type, location=loc, photo_url=url,
                   created_at=obj.created_at.isoformat())


class ReportList(BaseModel):
    items: list[ReportRead]
    total: int
