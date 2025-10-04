from sqlalchemy.orm import Session
from sqlalchemy import select, func
from app.db.models.report import Report, ReportType


class ReportRepository:
    def __init__(self, session: Session):
        self.session = session

    def create(
        self, *, type_: ReportType, description: str, lat: float, lon: float, photo_path: str | None
    ) -> Report:
        obj = Report(
            type=type_,
            description=description.strip(),
            latitude=lat,
            longitude=lon,
            photo_path=photo_path,
        )
        self.session.add(obj)
        self.session.commit()
        self.session.refresh(obj)
        return obj

    def get(self, id_: int) -> Report | None:
        res = self.session.execute(select(Report).where(Report.id == id_))
        return res.scalar_one_or_none()

    def list(self, *, skip: int, limit: int) -> tuple[list[Report], int]:
        q = select(Report).order_by(Report.created_at.desc()).offset(skip).limit(limit)
        res = self.session.execute(q)
        items = list(res.scalars().all())
        total = self.session.scalar(select(func.count()).select_from(Report))
        return items, int(total)