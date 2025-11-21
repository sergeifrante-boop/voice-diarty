"""Schemas for transcription endpoint."""

from pydantic import BaseModel, Field


class TranscribeResponse(BaseModel):
    """Response from /transcribe endpoint."""
    
    text: str = Field(..., description="Formatted transcript text")
    transcript: str = Field(..., description="Alias for text (backward compatibility)")
    language: str = Field(default="auto", description="Detected language code or 'auto'")

