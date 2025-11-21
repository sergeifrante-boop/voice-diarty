from datetime import datetime
from uuid import uuid4

from app.models.entry import Entry
from app.models.tag import Tag
from app.services.llm import analyze_transcript, format_transcript
from app.services.tags import aggregate_calendar, aggregate_tag_cloud


def make_entry(**kwargs):
    defaults = {
        "id": uuid4(),
        "user_id": 1,
        "title": "",
        "mood_label": "calm",
        "transcript": "",
        "audio_key": None,  # Text-first: no audio stored
        "audio_url": None,  # Text-first: no audio stored
        "insights": ["ok"],
        "created_at": datetime(2024, 5, 15, 21, 34),
        "tags": [],
    }
    defaults.update(kwargs)
    entry = Entry(**{k: v for k, v in defaults.items() if k not in {"tags"}})
    entry.tags = defaults["tags"]
    return entry


def test_llm_mock_detects_work_topic():
    result = analyze_transcript("Сегодня снова много работы")
    assert result["mood_label"] == "anxious"
    assert "работа" in result["tags"]


def test_tag_cloud_aggregation_counts_weights():
    entries = [
        make_entry(tags=[Tag(name="работа"), Tag(name="усталость")]),
        make_entry(tags=[Tag(name="работа")]),
    ]
    weights = aggregate_tag_cloud(entries)
    assert weights[0] == {"tag": "работа", "weight": 2}
    assert any(item["tag"] == "усталость" and item["weight"] == 1 for item in weights)


def test_calendar_aggregation_groups_by_day():
    entries = [
        make_entry(id=uuid4(), title="Запись 1", created_at=datetime(2024, 5, 15, 21, 34), tags=[Tag(name="работа")]),
        make_entry(id=uuid4(), title="Запись 2", created_at=datetime(2024, 5, 16, 9, 10), tags=[Tag(name="радость")]),
    ]
    calendar = aggregate_calendar(entries)
    assert calendar[0]["date"] == "2024-05-15"
    assert calendar[0]["entries"][0]["title"] == "Запись 1"
    assert calendar[1]["entries"][0]["tags"] == ["радость"]


def test_format_transcript_preserves_mixed_languages():
    """Test that format_transcript preserves both English and Russian in mixed-language input."""
    # Input with English first, then Russian (exact example from user request)
    mixed_input = "Today I feel really tired and confused, а потом я начал говорить по-русски"
    
    # Format the transcript (using mock provider in tests)
    formatted = format_transcript(mixed_input)
    
    # Assertions: both languages must be preserved
    assert "Today" in formatted, "English segment 'Today' must be preserved"
    assert "feel really tired" in formatted, "English segment 'feel really tired' must be preserved"
    assert "confused" in formatted, "English segment 'confused' must be preserved"
    assert "а потом" in formatted, "Russian segment 'а потом' must be preserved"
    assert "я начал" in formatted, "Russian segment 'я начал' must be preserved"
    assert "говорить по-русски" in formatted, "Russian segment 'говорить по-русски' must be preserved"
    
    # Ensure no translation occurred - English words should not be translated to Russian
    # and Russian words should not be translated to English
    assert "Сегодня" not in formatted or "Today" in formatted, "English 'Today' should not be translated to 'Сегодня'"
    assert "устал" not in formatted or "tired" in formatted, "English 'tired' should not be replaced with Russian equivalent"
    
    # Ensure the full content is preserved (no significant truncation)
    assert len(formatted) >= len(mixed_input) * 0.8, "Formatted transcript should preserve most of the original content"
