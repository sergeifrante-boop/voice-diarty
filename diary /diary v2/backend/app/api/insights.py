"""Insights API router."""

from datetime import datetime, timedelta, timezone
from typing import Literal, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..core.database import get_db
from ..core.security import get_current_user
from ..models import Entry, Insight, User
from ..schemas.insight import InsightListItem, InsightRead
from ..services.insights import generate_entry_insight, generate_period_insight

router = APIRouter(prefix="/insights", tags=["insights"])


def _normalize_period(
    timeframe: Literal["week", "month", "year", "custom"],
    anchor_date: Optional[datetime] = None,
    from_date: Optional[datetime] = None,
    to_date: Optional[datetime] = None,
) -> tuple[datetime, datetime]:
    """Normalize period_from and period_to based on timeframe."""
    anchor = anchor_date or datetime.now(timezone.utc)

    if timeframe == "week":
        period_from = anchor - timedelta(days=anchor.weekday())
        period_to = period_from + timedelta(days=6, hours=23, minutes=59, seconds=59)
    elif timeframe == "month":
        period_from = anchor.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        if period_from.month == 12:
            period_to = period_from.replace(year=period_from.year + 1, month=1) - timedelta(seconds=1)
        else:
            period_to = period_from.replace(month=period_from.month + 1) - timedelta(seconds=1)
    elif timeframe == "year":
        period_from = anchor.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
        period_to = period_from.replace(year=period_from.year + 1) - timedelta(seconds=1)
    elif timeframe == "custom":
        if not from_date or not to_date:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="from and to dates required for custom timeframe")
        period_from = from_date.replace(hour=0, minute=0, second=0, microsecond=0)
        period_to = to_date.replace(hour=23, minute=59, second=59, microsecond=999999)
    else:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid timeframe: {timeframe}")

    return period_from, period_to


@router.get("/entry/{entry_id}", response_model=InsightRead)
async def get_entry_insight(
    entry_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get or generate insight for a specific entry."""
    entry = db.get(Entry, entry_id)
    if not entry or entry.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Entry not found")

    existing = db.execute(
        select(Insight).where(Insight.scope == "entry", Insight.source_entry_id == entry_id, Insight.user_id == current_user.id)
    ).scalar_one_or_none()

    if existing:
        return existing

    insight = await generate_entry_insight(entry, db)
    return insight


@router.get("/period", response_model=InsightRead)
async def get_period_insight(
    timeframe: Literal["week", "month", "year", "custom"] = Query(...),
    anchor_date: Optional[datetime] = Query(None, description="Anchor date for week/month/year (defaults to today)"),
    from_date: Optional[datetime] = Query(None, description="Start date for custom timeframe"),
    to_date: Optional[datetime] = Query(None, description="End date for custom timeframe"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get or generate insight for a time period."""
    period_from, period_to = _normalize_period(timeframe, anchor_date, from_date, to_date)

    existing = db.execute(
        select(Insight).where(
            Insight.scope == "period",
            Insight.user_id == current_user.id,
            Insight.timeframe == timeframe,
            Insight.period_from == period_from,
            Insight.period_to == period_to,
        )
    ).scalar_one_or_none()

    if existing:
        return existing

    insight = await generate_period_insight(current_user.id, period_from, period_to, timeframe, db)
    return insight


@router.post("/period/regenerate", response_model=InsightRead)
async def regenerate_period_insight(
    timeframe: Literal["week", "month", "year", "custom"] = Query(...),
    anchor_date: Optional[datetime] = Query(None),
    from_date: Optional[datetime] = Query(None),
    to_date: Optional[datetime] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Force regeneration of period insight."""
    period_from, period_to = _normalize_period(timeframe, anchor_date, from_date, to_date)

    existing = db.execute(
        select(Insight).where(
            Insight.scope == "period",
            Insight.user_id == current_user.id,
            Insight.timeframe == timeframe,
            Insight.period_from == period_from,
            Insight.period_to == period_to,
        )
    ).scalar_one_or_none()

    if existing:
        db.delete(existing)
        db.commit()

    insight = await generate_period_insight(current_user.id, period_from, period_to, timeframe, db)
    return insight


@router.get("", response_model=list[InsightListItem])
async def list_insights(
    scope: Optional[Literal["entry", "period"]] = Query(None),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List insights for the current user."""
    stmt = select(Insight).where(Insight.user_id == current_user.id)

    if scope:
        stmt = stmt.where(Insight.scope == scope)

    stmt = stmt.order_by(Insight.created_at.desc()).offset(offset).limit(limit)
    insights = db.execute(stmt).scalars().all()
    return insights

