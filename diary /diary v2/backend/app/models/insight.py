from datetime import datetime
from typing import Optional
from uuid import UUID as UUIDType, uuid4

from sqlalchemy import DateTime, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..core.database import Base, utc_now


class Insight(Base):
    __tablename__ = "insights"

    id: Mapped[UUIDType] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid4, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    scope: Mapped[str] = mapped_column(String(16), nullable=False)  # "entry" | "period"
    source_entry_id: Mapped[Optional[UUIDType]] = mapped_column(UUID(as_uuid=True), ForeignKey("entries.id", ondelete="CASCADE"), nullable=True)
    period_from: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    period_to: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    timeframe: Mapped[Optional[str]] = mapped_column(String(16), nullable=True)  # "week" | "month" | "year" | "custom"
    language: Mapped[Optional[str]] = mapped_column(String(8), nullable=True)
    summary: Mapped[str] = mapped_column(Text, nullable=False)
    details: Mapped[str] = mapped_column(Text, nullable=False)
    meta: Mapped[dict] = mapped_column(JSON, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, index=True)

    user: Mapped["User"] = relationship("User", back_populates="insights")
    source_entry: Mapped[Optional["Entry"]] = relationship("Entry", foreign_keys=[source_entry_id])

