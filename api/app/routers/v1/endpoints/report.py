from fastapi import APIRouter, Depends, UploadFile, File, Form, Request, HTTPException, Query
from pydantic import ValidationError
from sqlalchemy.orm import Session
from app.db.database import get_session
from app.repositories.report import ReportRepository
from app.services.report import ReportService
from app.schemas.report import ReportRead, ReportType, Location, ReportList
from app.utils.images import validate_and_store_image


router = APIRouter()


def get_service(session: Session = Depends(get_session)) -> ReportService:
    return ReportService(ReportRepository(session))


@router.post("/reports", response_model=ReportRead, status_code=201)
def create_report(
        request: Request,
        type: ReportType = Form(...),
        description: str = Form(...),
        lat: float = Form(...),
        lon: float = Form(...),
        photo: UploadFile | None = File(default=None),
        svc: ReportService = Depends(get_service),
):
    try:
        loc = Location(lat=lat, lon=lon)
    except ValidationError:
        raise HTTPException(
            status_code=422,
            detail="Invalid coordinates. Latitude must be between -90 and 90, longitude between -180 and 180."
        )

    photo_name = validate_and_store_image(photo) if photo and photo.filename else None

    obj = svc.create(type_=type, description=description, lat=lat, lon=lon, photo_path=photo_name)
    base = str(request.base_url).rstrip("/")
    return ReportRead.from_orm_with_photo(obj, base_url=base)


@router.get("/reports/{report_id}", response_model=ReportRead, status_code=200)
def get_report(report_id: int, request: Request, svc: ReportService = Depends(get_service)):
    obj = svc.get(report_id)
    if not obj:
        raise HTTPException(status_code=404, detail=f"Report with id={report_id} not found")
    base = str(request.base_url).rstrip("/")
    return ReportRead.from_orm_with_photo(obj, base_url=base)


@router.get("/reports", response_model=ReportList, status_code=200)
def list_reports(
    request: Request,
    skip: int = Query(0, ge=0, description="Number of items to skip"),
    limit: int = Query(50, le=200, description="Max number of items to return"),
    svc: ReportService = Depends(get_service),
):
    items, total = svc.list(skip=skip, limit=limit)
    base = str(request.base_url).rstrip("/")
    reports = [ReportRead.from_orm_with_photo(obj, base_url=base) for obj in items]
    return ReportList(items=reports, total=total)
