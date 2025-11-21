from datetime import datetime
from typing import Dict, List, Literal, Optional, Union
from uuid import UUID

from pydantic import BaseModel, Field


class InsightMeta(BaseModel):
    """Typed structure for insight.meta JSON field."""

    mood_trend: Optional[Literal["neutral", "positive", "negative"]] = None
    emotional_trend: Optional[Literal["improving", "declining", "mixed", "stable"]] = None
    confidence: Optional[float] = Field(None, ge=0.0, le=1.0)
    top_topics: Optional[List[str]] = None
    top_tags: Optional[List[Dict[str, Union[str, float]]]] = None
    key_insights: Optional[List[str]] = None
    focus_recommendations: Optional[List[str]] = None


class InsightRead(BaseModel):
    """Full insight response schema."""

    id: UUID
    scope: Literal["entry", "period"]
    source_entry_id: Optional[UUID] = None
    period_from: Optional[datetime] = None
    period_to: Optional[datetime] = None
    timeframe: Optional[Literal["week", "month", "year", "custom"]] = None
    language: Optional[str] = None
    summary: str
    details: str
    meta: Union[InsightMeta, dict]
    created_at: datetime

    class Config:
        from_attributes = True


class InsightListItem(BaseModel):
    """Minimal insight for list views."""

    id: UUID
    scope: Literal["entry", "period"]
    summary: str
    created_at: datetime
    timeframe: Optional[str] = None

    class Config:
        from_attributes = True

