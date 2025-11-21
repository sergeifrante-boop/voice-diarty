"""Tests for insight generation service."""

from datetime import datetime
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

import pytest

from app.models.entry import Entry
from app.models.insight import Insight
from app.models.tag import Tag
from app.services.insights import generate_entry_insight, generate_period_insight


@pytest.fixture
def mock_entry():
    entry = Entry(
        id=uuid4(),
        user_id=1,
        audio_key=None,  # Text-first: no audio stored
        audio_url=None,  # Text-first: no audio stored
        transcript="Сегодня много работы, чувствую усталость",
        title="Мысли о работе",
        mood_label="anxious",
        insights=["insight 1"],
        word_count=5,
        created_at=datetime(2024, 5, 15, 21, 34),
    )
    entry.tags = [Tag(name="работа"), Tag(name="усталость")]
    return entry


@pytest.fixture
def mock_openai_response():
    return {
        "summary": "Entry about work and fatigue",
        "bullets": ["Work stress", "Feeling tired"],
        "suggestion": "Consider taking a break",
        "mood_trend": "negative",
        "confidence": 0.85,
        "top_topics": ["work", "fatigue"],
        "language": "ru",
    }


@patch("app.services.insights._get_openai_client")
@pytest.mark.asyncio
async def test_generate_entry_insight(mock_client_factory, mock_entry, mock_openai_response, db_session):
    import json

    mock_client = MagicMock()
    mock_completion = MagicMock()
    mock_completion.choices = [MagicMock()]
    mock_completion.choices[0].message.content = json.dumps(mock_openai_response)
    mock_client.chat.completions.create.return_value = mock_completion
    mock_client_factory.return_value = mock_client

    db_session.add(mock_entry)
    db_session.commit()

    insight = await generate_entry_insight(mock_entry, db_session)

    assert insight.scope == "entry"
    assert insight.source_entry_id == mock_entry.id
    assert insight.user_id == mock_entry.user_id
    assert insight.language == "ru"
    assert insight.summary
    assert insight.details
    assert "mood_trend" in insight.meta


@patch("app.services.insights._get_openai_client")
@pytest.mark.asyncio
async def test_generate_period_insight(mock_client_factory, db_session):
    user_id = 1
    period_from = datetime(2024, 5, 1)
    period_to = datetime(2024, 5, 31)
    timeframe = "month"

    entries = [
        Entry(
            id=uuid4(),
            user_id=user_id,
            audio_key=None,  # Text-first: no audio stored
            audio_url=None,  # Text-first: no audio stored
            transcript=f"Entry {i}",
            title=f"Title {i}",
            mood_label="calm" if i % 2 == 0 else "anxious",
            insights=["insight"],
            word_count=10,
            created_at=datetime(2024, 5, i + 1),
        )
        for i in range(5)
    ]
    for entry in entries:
        entry.tags = [Tag(name="test")]
        db_session.add(entry)
    db_session.commit()

    mock_client = MagicMock()
    mock_completion = MagicMock()
    mock_completion.choices = [MagicMock()]
    mock_completion.choices[0].message.content = '{"summary": "Period summary", "key_insights": ["insight 1"], "emotional_trend": "mixed", "focus_recommendations": ["rec 1"], "top_tags": [{"tag": "test", "weight": 1.0}], "language": "ru"}'
    mock_client.chat.completions.create.return_value = mock_completion
    mock_client_factory.return_value = mock_client

    insight = await generate_period_insight(user_id, period_from, period_to, timeframe, db_session)

    assert insight.scope == "period"
    assert insight.user_id == user_id
    assert insight.period_from == period_from
    assert insight.period_to == period_to
    assert insight.timeframe == timeframe
    assert insight.summary
    assert insight.details
    assert "emotional_trend" in insight.meta


@pytest.mark.asyncio
async def test_generate_period_insight_no_entries(db_session):
    with pytest.raises(ValueError, match="No entries found"):
        await generate_period_insight(999, datetime(2024, 1, 1), datetime(2024, 1, 31), "month", db_session)

