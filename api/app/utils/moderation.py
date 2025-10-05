from __future__ import annotations
from typing import Optional, List, Set
import os
import re
import unicodedata
import logging

from pydantic import BaseModel, Field
from openai import OpenAI

log = logging.getLogger(__name__)
log.setLevel(logging.INFO)

FAIL_CLOSED = os.getenv("MODERATION_FAIL_CLOSED", "false").lower() in {"1", "true", "yes"}

STRICT_PROFANITY = os.getenv("STRICT_PROFANITY", "true").lower() in {"1", "true", "yes"}

BLOCK_CATEGORIES: Set[str] = {
    "harassment", "harassment/threats",
    "hate", "hate/threats",
    "violence", "graphic-violence",
    "sexual", "sexual/minors",
    "illicit-behavior", "self-harm", "self-harm/instructions",
}

_client = OpenAI()


def _normalize(text: str) -> str:
    t = unicodedata.normalize("NFKD", text)
    t = "".join(ch for ch in t if not unicodedata.combining(ch))
    return t.lower()


def _fuzzy(stem: str) -> str:
    parts = [re.escape(ch) + r"[\W_]*" for ch in stem]
    return r"\b" + "".join(parts)


_STRONG_PL_STEMS = [
    "kurwa",
    "chuj", "huj",
    "jeb",
    "pierdol",
    "spierdal",
    "skurwysyn",
    "pizd",
]

_PROFANITY_PATTERNS = [re.compile(_fuzzy(stem), re.IGNORECASE | re.UNICODE) for stem in _STRONG_PL_STEMS]

_OBFUSCATED = [
    re.compile(r"\bk[\W_]*[*x$#]{2,}[\W_]*a\b", re.IGNORECASE | re.UNICODE),
    re.compile(r"\bp[\W_]*[*x$#]{2,}[\W_]*d[\W_]*a\b", re.IGNORECASE | re.UNICODE),
    re.compile(r"\bs[\W_]*pier[\W_]*[*x$#]{2,}[\W_]*aj\b", re.IGNORECASE | re.UNICODE),
]


def _contains_strong_profanity(text: str) -> bool:
    t = text.strip()
    if not t:
        return False
    norm = _normalize(t)
    return any(p.search(t) or p.search(norm) for p in (_PROFANITY_PATTERNS + _OBFUSCATED))


def _call_moderation_model(text: str):
    try:
        return _client.moderations.create(model="omni-moderation-latest", input=text)
    except Exception as e_omni:
        log.warning("omni-moderation-latest not available: %s -> fallback to text-moderation-latest", e_omni)
        return _client.moderations.create(model="text-moderation-latest", input=text)


class ModerationVerdict(BaseModel):
    allowed: bool = Field(..., description="Czy treść jest dozwolona")
    categories: List[str] = Field(default_factory=list)
    reasoning: str = Field(default="")


def moderate_text(text: Optional[str]) -> bool:
    """
    True  -> treść DOZWOLONA
    False -> treść NIEDOZWOLONA
    """
    t = (text or "").strip()
    if not t:
        return True

    if STRICT_PROFANITY and _contains_strong_profanity(t):
        log.info("moderation local block: strong profanity matched")
        return False

    try:
        resp = _call_moderation_model(t)
        res = resp.results[0]
        flagged = bool(getattr(res, "flagged", False))
        categories_dict = dict(getattr(res, "categories", {}) or {})
        active_cats = sorted([k for k, v in categories_dict.items() if v])
        block_due_to_cats = any(c.lower() in BLOCK_CATEGORIES for c in active_cats)
        block = flagged or block_due_to_cats
        log.info("moderation verdict flagged=%s cats=%s", flagged, active_cats)
        return not block
    except Exception as e:
        log.error("moderation error: %s (fail_closed=%s)", e, FAIL_CLOSED)
        return not FAIL_CLOSED


def ensure_allowed_or_none(text: Optional[str]) -> Optional[str]:
    return (text if moderate_text(text) else None)
