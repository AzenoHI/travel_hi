from datetime import datetime
from typing import Literal, Optional, Annotated
from pydantic import BaseModel, Field

class TrafficReport(BaseModel):
    mode: Literal["tram", "bus", "metro", "train"]
    line: Optional[str] = None
    city: str
    latitude: Annotated[float, Field(ge=-90, le=90)]
    longitude: Annotated[float, Field(ge=-180, le=180)]
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    user_text: Optional[str] = None

class DisruptionPrediction(BaseModel):
    probability: Annotated[float, Field(ge=0.0, le=1.0)]
    category: Literal["delay", "breakdown", "accident", "congestion", "strike", "unknown"]
    # ⬇️ usuwamy max_length – pozwalamy na dłuższy tekst
    reasoning: str
    recommended_action: str
    confidence: Annotated[float, Field(ge=0.0, le=1.0)]
