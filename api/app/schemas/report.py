from pydantic import BaseModel, Field, field_validator, ConfigDict
from enum import Enum


class ReportType(str, Enum):
    ROADBLOCK = "ROADBLOCK"
    TRAFFIC_JAM = "TRAFFIC_JAM"
    ACCIDENT = "ACCIDENT"
    CONSTRUCTION = "CONSTRUCTION"
    OTHER = "OTHER"


class Location(BaseModel):
    lat: float = Field(..., ge=-90, le=90)
    lon: float = Field(..., ge=-180, le=180)


class ReportCreate(BaseModel):
    type: ReportType
    description: str = Field(..., min_length=10, max_length=2000)
    location: Location


class ReportRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    type: ReportType
    description: str
    location: Location
    photo_url: str | None
    created_at: str

    @classmethod
    def from_orm_with_photo(cls, obj, base_url: str | None = None):
        loc = Location(lat=obj.latitude, lon=obj.longitude)
        url = None
        if obj.photo_path and base_url:
            url = f"{base_url}/files/{obj.photo_path.split('/')[-1]}"
        return cls(id=obj.id, type=obj.type, description=obj.description, location=loc, photo_url=url,
                   created_at=obj.created_at.isoformat())


class ReportList(BaseModel):
    items: list[ReportRead]
    total: int
