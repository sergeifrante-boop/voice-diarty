from datetime import datetime
from typing import Optional
from uuid import UUID as UUIDType, uuid4

from sqlalchemy import JSON, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..core.database import Base, utc_now
from .tag import entry_tags


class Entry(Base):
    __tablename__ = "entries"

    id: Mapped[UUIDType] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    audio_key: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    audio_url: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    transcript: Mapped[str] = mapped_column(Text, nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    mood_label: Mapped[str] = mapped_column(String(32), nullable=False)
    insights: Mapped[list[str]] = mapped_column(JSON, nullable=False)
    word_count: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, index=True)

    user: Mapped["User"] = relationship("User", back_populates="entries")
    tags: Mapped[list["Tag"]] = relationship("Tag", secondary=entry_tags, back_populates="entries")
