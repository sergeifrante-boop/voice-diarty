import logging
import uuid
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy import func
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

from ..core.config import get_settings
from ..core.database import get_db
from ..core.security import get_current_user
from ..models import Entry, Tag
from ..schemas.entry import EntryCreateRequest, EntryCreateResponse, EntryDetailResponse, EntryListResponse
from ..services.tags import calendar_view, tag_cloud

settings = get_settings()

router = APIRouter(prefix="/entries", tags=["entries"])
tag_router = APIRouter(tags=["tags"])


def serialize_entry(entry: Entry, *, include_transcript: bool = False) -> dict:
    tags = [tag.name for tag in entry.tags]
    payload = {
        "id": entry.id,
        "title": entry.title,
        "mood_label": entry.mood_label,
        "tags": tags,
        "created_at": entry.created_at,
    }
    if include_transcript:
        payload.update({
            "transcript": entry.transcript,
            "insights": entry.insights,
        })
    else:
        payload["transcript_preview"] = entry.transcript[:120]
    return payload


@router.post("/", response_model=EntryCreateResponse, status_code=status.HTTP_201_CREATED)
def create_entry(
    payload: EntryCreateRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Create a new entry from already-transcribed text.
    
    This endpoint accepts only the transcript. No audio processing or analysis is performed.
    Analysis will be handled by a separate endpoint/function with special LLM instructions.
    """
    try:
        transcript = payload.transcript.strip()
        if not transcript:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Transcript cannot be empty"
            )
        
        # DEBUG: Log transcript before saving to verify both languages are present
        logger.info(f"ENTRY_TRANSCRIPT_TO_SAVE: {transcript}")
        
        word_count = len(transcript.split())
        
        # Create entry with minimal required fields
        # Title, mood_label, insights, and tags will be set later via analysis endpoint
        entry = Entry(
            user_id=current_user.id,
            audio_key=None,  # No audio stored
            audio_url=None,  # No audio stored
            transcript=transcript,
            title="",  # Will be set by analysis endpoint
            mood_label="neutral",  # Default, will be updated by analysis
            insights=[],  # Will be populated by analysis endpoint
            word_count=word_count,
            tags=[],  # Will be populated by analysis endpoint
        )
        
        db.add(entry)
        db.commit()
        db.refresh(entry)

        return serialize_entry(entry, include_transcript=True)
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create entry: {str(e)}"
        ) from e


@router.get("/", response_model=EntryListResponse)
def list_entries(
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    tag: Optional[str] = None,
    limit: int = 20,
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    query = db.query(Entry).filter(Entry.user_id == current_user.id)

    if date_from:
        query = query.filter(Entry.created_at >= date_from)
    if date_to:
        query = query.filter(Entry.created_at <= date_to)
    if tag:
        query = query.join(Entry.tags).filter(func.lower(Tag.name) == func.lower(tag)).distinct(Entry.id)

    total = query.order_by(None).count()
    entries = query.order_by(Entry.created_at.desc()).offset(offset).limit(limit).all()

    payload = [serialize_entry(entry) for entry in entries]
    return EntryListResponse(entries=payload, total=total)


@router.get("/{entry_id}", response_model=EntryDetailResponse)
def get_entry(entry_id: uuid.UUID, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    entry = db.get(Entry, entry_id)
    if not entry or entry.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Entry not found")
    return serialize_entry(entry, include_transcript=True)


@router.get("/calendar")
def get_calendar(month: str, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return calendar_view(db, user_id=current_user.id, month=month)


@tag_router.get("/tags-cloud")
def get_tags_cloud(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return tag_cloud(db, user_id=current_user.id)
