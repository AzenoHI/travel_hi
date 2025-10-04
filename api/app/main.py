from fastapi import FastAPI
from dotenv import load_dotenv

load_dotenv()

from app.routers import disruptions

app = FastAPI(title="TravelHI API", version="0.1.0")

app.include_router(disruptions.router)

@app.get("/")
def root():
    return {"status": "ok", "service": "travel_hi"}
