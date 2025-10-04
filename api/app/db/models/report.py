import enum
from sqlalchemy import Enum, String, Integer, Float, Text, DateTime, text
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func
from app.db.database import Base


class ReportType(str, enum.Enum):
    ACCIDENT = "accident"
    ROADWORK = "roadwork"
    CLOSURE = "closure"
    POLICE = "police"
    OTHER = "other"


class Report(Base):
    __tablename__ = "reports"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    type: Mapped[ReportType] = mapped_column(Enum(ReportType, name="report_type"), nullable=False, index=True)
    latitude: Mapped[float] = mapped_column(Float, nullable=False, index=True)
    longitude: Mapped[float] = mapped_column(Float, nullable=False, index=True)
    photo_path: Mapped[str | None] = mapped_column(String(512), nullable=True)
    created_at: Mapped["DateTime"] = mapped_column(
        DateTime(timezone=True),
        server_default=text("(datetime('now'))"),
        nullable=False,
    )