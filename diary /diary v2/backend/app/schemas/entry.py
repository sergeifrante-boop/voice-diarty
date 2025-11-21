from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, Field


class EntryCreateRequest(BaseModel):
    """Request to create a new entry from already-transcribed text."""
    transcript: str = Field(..., min_length=1, description="Transcribed text (from /transcribe endpoint)")


class EntryBase(BaseModel):
    id: UUID
    title: str
    mood_label: str
    tags: List[str]
    created_at: datetime


class EntrySummary(EntryBase):
    transcript_preview: str


class EntryDetailResponse(EntryBase):
    transcript: str
    insights: List[str]


class EntryCreateResponse(EntryDetailResponse):
    pass


class EntryListResponse(BaseModel):
    entries: List[EntrySummary]
    total: int
