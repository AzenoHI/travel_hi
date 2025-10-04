from fastapi import Depends, FastAPI

from dotenv import load_dotenv
from app.routers import disruptions
from sqlalchemy.orm import Session
from .db.database import Base, engine, get_session
from .routers.v1.api import api_router
load_dotenv()

app = FastAPI(
    title="Travel Hi API", version="1.0.0", description="API for managing travels."
)


app.include_router(disruptions.router)
app.include_router(api_router, prefix="/api/v1")


@app.get("/health")
async def healthcheck() -> dict[str, str]:
    return {"status": "ok"}
