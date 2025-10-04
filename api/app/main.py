from app.routers.v1.api import api_router
from fastapi import FastAPI


app = FastAPI(
    title="Travel Hi API", version="1.0.0", description="API for managing travels."
)

app.include_router(api_router, prefix="/api/v1")


@app.get("/health")
async def healthcheck() -> dict[str, str]:
    return {"status": "ok"}
