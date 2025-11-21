"""Insight generation service using LLM."""

from __future__ import annotations

import json
import logging
from collections import Counter
from datetime import datetime, timedelta
from typing import Literal, Optional
from uuid import UUID

from openai import OpenAI, OpenAIError
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..core.config import get_settings
from ..models import Entry, Insight

logger = logging.getLogger(__name__)
settings = get_settings()


def _get_openai_client() -> OpenAI:
    if not settings.openai_api_key:
        raise RuntimeError("OPENAI_API_KEY is required for insight generation")
    return OpenAI(api_key=settings.openai_api_key)


def _count_words(text: str) -> int:
    return len(text.split())


ENTRY_INSIGHT_PROMPT = """You are a reflective diary assistant that helps users understand their thoughts and feelings.

Analyze the following diary entry and provide insights in JSON format.

Rules:
- Respond in the same language as the entry text (detect it if needed)
- Be gentle, supportive, and non-therapeutic
- Do not provide medical advice or diagnoses
- Focus on patterns, emotions, and gentle reflections

Return a JSON object with these exact fields:
{{
  "summary": "1-2 sentence summary of what this entry is about",
  "bullets": ["insight 1", "insight 2", "insight 3"],
  "suggestion": "one gentle suggestion or reflection question",
  "mood_trend": "neutral | positive | negative",
  "confidence": 0.0-1.0,
  "top_topics": ["topic1", "topic2"],
  "language": "detected language code (e.g., ru, en, uk)"
}}

Entry text:
{{transcript}}

Entry metadata:
- Date: {{date}}
- Mood label: {{mood_label}}
- Tags: {{tags}}
- Word count: {{word_count}}
"""

PERIOD_INSIGHT_PROMPT = """You are a reflective diary assistant that helps users understand patterns across multiple diary entries.

Analyze the following period of entries and provide high-level insights in JSON format.

Rules:
- Respond in the same language as most entries (detect it if needed)
- Be gentle, supportive, and non-therapeutic
- Do not provide medical advice or diagnoses
- Focus on trends, patterns, and gentle reflections

Return a JSON object with these exact fields:
{{
  "summary": "High-level overview of this period (2-3 sentences)",
  "key_insights": ["insight 1", "insight 2", "insight 3"],
  "emotional_trend": "improving | declining | mixed | stable",
  "focus_recommendations": ["recommendation 1", "recommendation 2"],
  "top_tags": [{{"tag": "tag1", "weight": 0.7}}, {{"tag": "tag2", "weight": 0.5}}],
  "language": "detected language code (e.g., ru, en, uk)"
}}

Period statistics:
{{stats}}

Sample entries (truncated):
{{entries_text}}
"""


async def generate_entry_insight(entry: Entry, db: Session) -> Insight:
    """Generate an insight for a single diary entry."""
    client = _get_openai_client()
    tags = [tag.name for tag in entry.tags]
    word_count = entry.word_count or _count_words(entry.transcript)

    prompt = ENTRY_INSIGHT_PROMPT.format(
        transcript=entry.transcript,
        date=entry.created_at.strftime("%Y-%m-%d"),
        mood_label=entry.mood_label,
        tags=", ".join(tags) if tags else "none",
        word_count=word_count,
    ).replace("{{", "{").replace("}}", "}")

    try:
        completion = client.chat.completions.create(
            model=settings.openai_llm_model,
            temperature=0.3,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": "You are a reflective diary assistant. Always respond with valid JSON."},
                {"role": "user", "content": prompt},
            ],
        )
    except OpenAIError as exc:
        logger.exception("OpenAI API failed for entry insight")
        raise RuntimeError("Failed to generate entry insight") from exc

    content = completion.choices[0].message.content
    if not content:
        raise ValueError("LLM returned empty content")

    try:
        data = json.loads(content)
    except json.JSONDecodeError as exc:
        logger.error("LLM returned invalid JSON: %s", content)
        raise ValueError("LLM returned invalid JSON") from exc

    language = data.get("language", "ru")
    summary = data.get("summary", "")
    bullets = data.get("bullets", [])
    suggestion = data.get("suggestion", "")

    details = "\n".join([f"- {b}" for b in bullets])
    if suggestion:
        details += f"\n\n**Reflection:** {suggestion}"

    meta = {
        "mood_trend": data.get("mood_trend"),
        "confidence": data.get("confidence"),
        "top_topics": data.get("top_topics", []),
    }

    insight = Insight(
        user_id=entry.user_id,
        scope="entry",
        source_entry_id=entry.id,
        language=language,
        summary=summary,
        details=details,
        meta=meta,
    )
    db.add(insight)
    db.commit()
    db.refresh(insight)
    return insight


async def generate_period_insight(
    user_id: int,
    period_from: datetime,
    period_to: datetime,
    timeframe: Literal["week", "month", "year", "custom"],
    db: Session,
) -> Insight:
    """Generate an aggregated insight for a time period."""
    client = _get_openai_client()

    stmt = (
        select(Entry)
        .where(Entry.user_id == user_id, Entry.created_at >= period_from, Entry.created_at <= period_to)
        .order_by(Entry.created_at.asc())
    )
    entries = db.execute(stmt).scalars().all()

    if not entries:
        raise ValueError("No entries found for this period")

    total_entries = len(entries)
    days_span = (period_to - period_from).days or 1
    entries_per_week = (total_entries / days_span) * 7

    mood_labels = [e.mood_label for e in entries]
    mood_dist = Counter(mood_labels)

    all_tags = []
    for entry in entries:
        all_tags.extend([tag.name for tag in entry.tags])
    tag_counts = Counter(all_tags)
    top_tags = [{"tag": tag, "count": count} for tag, count in tag_counts.most_common(10)]

    word_counts = [e.word_count or _count_words(e.transcript) for e in entries]
    avg_word_count = sum(word_counts) / len(word_counts) if word_counts else 0

    stats_text = f"""Total entries: {total_entries}
Entries per week: {entries_per_week:.1f}
Average word count: {avg_word_count:.0f}
Mood distribution: {dict(mood_dist)}
Top tags: {', '.join([t['tag'] for t in top_tags[:5]])}
"""

    entries_text_parts = []
    for entry in entries[:20]:
        preview = entry.transcript[:200] + "..." if len(entry.transcript) > 200 else entry.transcript
        entries_text_parts.append(f"[{entry.created_at.strftime('%Y-%m-%d')}] {preview}")
    entries_text = "\n\n".join(entries_text_parts)

    if len(entries) > 20:
        entries_text += f"\n\n... and {len(entries) - 20} more entries"

    prompt = PERIOD_INSIGHT_PROMPT.format(stats=stats_text, entries_text=entries_text).replace("{{", "{").replace("}}", "}")

    try:
        completion = client.chat.completions.create(
            model=settings.openai_llm_model,
            temperature=0.3,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": "You are a reflective diary assistant. Always respond with valid JSON."},
                {"role": "user", "content": prompt},
            ],
        )
    except OpenAIError as exc:
        logger.exception("OpenAI API failed for period insight")
        raise RuntimeError("Failed to generate period insight") from exc

    content = completion.choices[0].message.content
    if not content:
        raise ValueError("LLM returned empty content")

    try:
        data = json.loads(content)
    except json.JSONDecodeError as exc:
        logger.error("LLM returned invalid JSON: %s", content)
        raise ValueError("LLM returned invalid JSON") from exc

    language = data.get("language", "ru")
    summary = data.get("summary", "")
    key_insights = data.get("key_insights", [])
    focus_recommendations = data.get("focus_recommendations", [])

    details = "**Key Insights:**\n" + "\n".join([f"- {i}" for i in key_insights])
    if focus_recommendations:
        details += "\n\n**Focus Recommendations:**\n" + "\n".join([f"- {r}" for r in focus_recommendations])

    meta = {
        "emotional_trend": data.get("emotional_trend"),
        "top_tags": data.get("top_tags", []),
        "key_insights": key_insights,
        "focus_recommendations": focus_recommendations,
    }

    insight = Insight(
        user_id=user_id,
        scope="period",
        period_from=period_from,
        period_to=period_to,
        timeframe=timeframe,
        language=language,
        summary=summary,
        details=details,
        meta=meta,
    )
    db.add(insight)
    db.commit()
    db.refresh(insight)
    return insight

