# app/routers/v1/endpoints/disruptions.py
from typing import Optional
from fastapi import APIRouter, HTTPException, status

from app.schemas.traffic import TrafficReport, DisruptionPrediction
from app.utils.llm import assess_disruption


router = APIRouter(prefix="/disruptions", tags=["AI"])

# ---------------------------------------------------------
# 🤖 AI Disruption Prediction
# ---------------------------------------------------------

@router.post(
    "/predict",
    response_model=Optional[DisruptionPrediction],
    status_code=status.HTTP_200_OK,
    summary="Predict potential traffic disruptions using AI (LLM)",
    response_description="Predicted disruption category, severity, and confidence score",
)
def predict_disruption(report: TrafficReport) -> Optional[DisruptionPrediction]:
    """
    ### 🤖 Predict potential traffic disruptions

    This endpoint uses an **AI model (LLM)** to analyze traffic-related text reports
    and determine the **type, severity, and likelihood** of a potential disruption.

    The model interprets natural-language reports and produces structured insights,
    helping the system or user assess the impact of incidents in real-time.

    **Request Body:**
    - `source`: name of the reporter or data feed
    - `content`: text of the traffic report
    - `location`: optional geolocation metadata (latitude, longitude)
    - `timestamp`: time of the reported event

    **Example Request:**
    ```json
    {
      "source": "User123",
      "content": "Massive traffic jam on the A4 highway near Katowice due to a truck accident.",
      "location": {"lat": 50.259, "lng": 19.021},
      "timestamp": "2025-10-05T09:00:00Z"
    }
    ```

    **Example Response:**
    ```json
    {
      "category": "ACCIDENT",
      "severity": "HIGH",
      "confidence": 0.93,
      "summary": "Truck accident likely causing severe traffic delays."
    }
    ```

    **Responses:**
    -  `200 OK`: Successful AI prediction
    -  `503 Service Unavailable`: Model or inference error
    -  `422 Unprocessable Entity`: Invalid request schema

    **Usage Tip:**
    You can feed this endpoint user-generated messages, system alerts, or social-media traffic feeds.
    The underlying LLM enriches and classifies them in near real-time.
    """
    try:
        return assess_disruption(report)
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"LLM error: {e}")
