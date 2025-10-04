# app/utils/llm.py
from typing import Literal
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.pydantic_v1 import BaseModel, Field
from app.schemas.traffic import TrafficReport, DisruptionPrediction

# Structured output – bez max_length i bez przycinania po stronie serwera
class _AssessmentModel(BaseModel):
    probability: float = Field(..., ge=0.0, le=1.0)
    category: Literal["delay", "breakdown", "accident", "congestion", "strike", "unknown"]
    # krótko, ale treściwie — wymuszone tylko instrukcją w promptcie
    reasoning: str = Field(..., description="1–2 zwięzłe zdania, konkret.")
    recommended_action: str = Field(..., description="Jedno zwięzłe zdanie z zaleceniem.")
    confidence: float = Field(..., ge=0.0, le=1.0)

_BASE_PROMPT = ChatPromptTemplate.from_messages([
    ("system",
     "Jesteś analitykiem transportu publicznego. "
     "Zwracaj wynik ZWIĘZŁY, ale KONKRETNY. "
     "Formę trzymaj tak: 'reasoning' = 1–2 zdania (ok. 15–40 słów), "
     "'recommended_action' = 1 zdanie (ok. 10–25 słów). "
     "Bez dygresji, po polsku. "
     "category wybierz wyłącznie z: delay, breakdown, accident, congestion, strike, unknown."),
    ("human",
     "Miasto: {city}\n"
     "Środek: {mode}\n"
     "Linia: {line}\n"
     "Lokalizacja: {lat}, {lon}\n"
     "Czas: {timestamp}\n"
     "Opis użytkownika: {user_text}\n"
     "Zwróć wynik zgodny ze schematem.")
])

# Model i krótkie odpowiedzi (bez brutalnego limitu długości)
_llm = ChatOpenAI(model="gpt-5-mini", temperature=0.2, max_tokens=260)
_structured = _llm.with_structured_output(_AssessmentModel)

def _missing_fields(res: _AssessmentModel) -> list[str]:
    missing = []
    for f in ("probability", "category", "reasoning", "recommended_action", "confidence"):
        val = getattr(res, f, None)
        if val is None or (isinstance(val, str) and not val.strip()):
            missing.append(f)
    return missing

def assess_disruption(report: TrafficReport) -> DisruptionPrediction:
    variables = {
        "city": report.city,
        "mode": report.mode,
        "line": report.line or "unknown",
        "lat": report.latitude,
        "lon": report.longitude,
        "timestamp": report.timestamp.isoformat(),
        "user_text": report.user_text or "brak",
    }

    # 1. podejście
    result = (_BASE_PROMPT | _structured).invoke(variables)

    # Jeśli czegoś brakuje – spróbuj raz jeszcze z doprecyzowaniem
    if result is None or _missing_fields(result):
        repair_prompt = ChatPromptTemplate.from_messages([
            *_BASE_PROMPT.messages,
            ("system",
             "Poprzednia odpowiedź była niekompletna. "
             "Uzupełnij WSZYSTKIE pola ('probability', 'category', 'reasoning', 'recommended_action', 'confidence'). "
             "Zachowaj długość: reasoning 1–2 zdania, recommended_action 1 zdanie.")
        ])
        result = (repair_prompt | _structured).invoke(variables)

    # Jeżeli nadal nie ma – zwróć sensowny, ale nieprzycinany fallback
    if result is None or _missing_fields(result):
        return DisruptionPrediction(
            probability=0.6,
            category="unknown",
            reasoning="Na podstawie zgłoszenia szacowane umiarkowane ryzyko lokalnych opóźnień w najbliższym czasie.",
            recommended_action="Sprawdź alternatywne trasy i komunikaty przewoźnika; zaplanuj dodatkowe 10–20 minut.",
            confidence=0.55,
        )

    return DisruptionPrediction(
        probability=result.probability,
        category=result.category,
        reasoning=result.reasoning.strip(),
        recommended_action=result.recommended_action.strip(),
        confidence=result.confidence,
    )
