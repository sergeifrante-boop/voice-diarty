from __future__ import annotations

"""Utility helpers for working with tags."""

from collections import Counter, defaultdict
from datetime import date, datetime
from typing import Dict, Iterable, List, Union

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from ..models import Entry, Tag


def get_or_create_tags(db: Session, *, user_id: int, tag_names: Iterable[str]) -> List[Tag]:
    normalized = [name.strip().lower() for name in tag_names if name.strip()]
    if not normalized:
        return []

    existing = (
        db.execute(select(Tag).where(Tag.user_id == user_id, Tag.name.in_(normalized)))
        .scalars()
        .all()
    )
    tags_by_name = {tag.name: tag for tag in existing}

    created = []
    for name in normalized:
        if name not in tags_by_name:
            tag = Tag(name=name, user_id=user_id)
            db.add(tag)
            created.append(tag)
            tags_by_name[name] = tag
    if created:
        db.flush()
    return list(tags_by_name.values())


def tag_cloud(db: Session, *, user_id: int) -> List[Dict[str, Union[int, str]]]:
    entries = (
        db.query(Entry)
        .filter(Entry.user_id == user_id)
        .options(joinedload(Entry.tags))
        .all()
    )
    return aggregate_tag_cloud(entries)


def aggregate_tag_cloud(entries: Iterable[Entry]) -> List[Dict[str, Union[int, str]]]:
    counter = Counter()
    for entry in entries:
        counter.update(tag.name for tag in entry.tags)
    return [{"tag": tag, "weight": weight} for tag, weight in counter.most_common()]


def calendar_view(db: Session, *, user_id: int, month: str) -> List[dict]:
    start = datetime.strptime(month, "%Y-%m")
    if start.month == 12:
        end = start.replace(year=start.year + 1, month=1)
    else:
        end = start.replace(month=start.month + 1)

    entries = (
        db.query(Entry)
        .filter(Entry.user_id == user_id, Entry.created_at >= start, Entry.created_at < end)
        .options(joinedload(Entry.tags))
        .order_by(Entry.created_at.asc())
        .all()
    )

    return aggregate_calendar(entries)


def aggregate_calendar(entries: Iterable[Entry]) -> List[dict]:
    grouped: dict[date, list[Entry]] = defaultdict(list)
    for entry in entries:
        grouped[entry.created_at.date()].append(entry)

    payload = []
    for day in sorted(grouped):
        payload.append(
            {
                "date": day.isoformat(),
                "entries": [
                    {
                        "id": str(entry.id),
                        "title": entry.title,
                        "time": entry.created_at.strftime("%H:%M"),
                        "tags": [tag.name for tag in entry.tags],
                    }
                    for entry in grouped[day]
                ],
            }
        )
    return payload
