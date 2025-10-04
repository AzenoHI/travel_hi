from fastapi import APIRouter

from app.routers.v1.endpoints import event, disruptions
from app.routers.v1.endpoints import report

api_router = APIRouter()

api_router.include_router(event.router, prefix="/events", tags=["Events"])
api_router.include_router(report.router, prefix="", tags=["reports"])
api_router.include_router(disruptions.router, prefix="/disruptions", tags=["disruptions"])
