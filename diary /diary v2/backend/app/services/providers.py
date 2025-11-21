"""Provider factory helpers for AI integrations."""

from __future__ import annotations

import json
import logging
from abc import ABC, abstractmethod
from pathlib import Path
from typing import Dict, Optional

from openai import OpenAI
from openai import OpenAIError

from ..core.config import get_settings

logger = logging.getLogger(__name__)


class STTProvider(ABC):
    """Base interface for speech-to-text providers."""

    @abstractmethod
    def transcribe(self, file_path: str) -> str:
        raise NotImplementedError


class LLMProvider(ABC):
    """Base interface for transcript analysis providers."""

    @abstractmethod
    def analyze(self, transcript: str) -> Dict:
        raise NotImplementedError


class MockSTTProvider(STTProvider):
    """Deterministic STT provider for local development and tests."""

    def transcribe(self, file_path: str) -> str:  # noqa: D401
        path = Path(file_path)
        if not path.exists():
            raise FileNotFoundError(file_path)
        return "Это тестовая запись пользователя про работу и усталость"


class WhisperSTTProvider(STTProvider):
    """Wrapper around OpenAI Whisper (or GPT-4o transcribe) endpoints."""

    def __init__(self, api_key: str, model: str):
        self.client = OpenAI(api_key=api_key)
        self.model = model

    def transcribe(self, file_path: str) -> str:  # noqa: D401
        try:
            file_path_obj = Path(file_path)
            filename = file_path_obj.name
            
            # Read file as bytes and pass with filename for format detection
            with open(file_path, "rb") as audio_file:
                audio_bytes = audio_file.read()
            
            # Pass as tuple (filename, bytes) so OpenAI can detect the format
            response = self.client.audio.transcriptions.create(
                model=self.model,
                file=(filename, audio_bytes),
                response_format="text",
            )
        except OpenAIError as exc:  # pragma: no cover - network failure
            error_msg = str(exc)
            logger.exception(f"OpenAI STT failed: {error_msg}")
            # Include the actual OpenAI error message for better debugging
            raise RuntimeError(f"OpenAI STT request failed: {error_msg}") from exc

        # The SDK may return a plain string or an object with a `text` attribute.
        return getattr(response, "text", str(response))


class MockLLMProvider(LLMProvider):
    """Deterministic LLM provider used in development and tests."""

    def analyze(self, transcript: str) -> Dict:
        transcript_lower = transcript.lower()
        has_work = "работ" in transcript_lower
        tags = ["работа", "усталость", "сомнения"] if has_work else ["повседневное", "спокойствие"]
        mood = "anxious" if has_work else "calm"
        title = "Мысли о работе" if has_work else "Спокойный день"
        insights = [
            "Ты очень строго относишься к себе из-за работы.",
            (
                "Кажется, сейчас тебе бы помог небольшой отдых и поддержка."
                if has_work
                else "Продолжай замечать маленькие радости дня."
            ),
        ]
        return {
            "title": title,
            "mood_label": mood,
            "tags": tags,
            "insights": insights,
        }


class OpenAILLMProvider(LLMProvider):
    """OpenAI-powered analyzer that enforces JSON responses."""

    def __init__(self, api_key: str, prompt: str, model: str):
        self.client = OpenAI(api_key=api_key)
        self.prompt = prompt
        self.model = model

    def analyze(self, transcript: str) -> Dict:
        try:
            completion = self.client.chat.completions.create(
                model=self.model,
                temperature=0.2,
                response_format={"type": "json_object"},
                messages=[
                    {"role": "system", "content": self.prompt},
                    {"role": "user", "content": transcript},
                ],
            )
        except OpenAIError as exc:  # pragma: no cover - network failure
            logger.exception("OpenAI LLM failed")
            raise RuntimeError("OpenAI LLM request failed") from exc

        content = completion.choices[0].message.content
        if not content:
            raise ValueError("LLM returned empty content")

        try:
            payload = json.loads(content)
        except json.JSONDecodeError as exc:
            logger.error("LLM responded with invalid JSON: %s", content)
            raise ValueError("LLM returned invalid JSON") from exc

        required_fields = {"title", "mood_label", "tags", "insights"}
        missing = required_fields - payload.keys()
        if missing:
            raise ValueError(f"LLM response missing fields: {', '.join(sorted(missing))}")

        if not isinstance(payload["tags"], list):
            raise ValueError("LLM response field 'tags' must be a list")
        if not isinstance(payload["insights"], list):
            raise ValueError("LLM response field 'insights' must be a list")

        return payload


def build_stt_provider() -> STTProvider:
    settings = get_settings()
    if settings.stt_provider == "mock":
        return MockSTTProvider()
    if settings.stt_provider == "openai":
        api_key: Optional[str] = settings.stt_api_key or settings.openai_api_key
        if not api_key:
            raise RuntimeError("No API key available for STT provider")
        return WhisperSTTProvider(api_key=api_key, model=settings.openai_stt_model)
    raise ValueError(f"Unsupported STT provider: {settings.stt_provider}")


def build_llm_provider(prompt: str) -> LLMProvider:
    settings = get_settings()
    if settings.llm_provider == "mock":
        return MockLLMProvider()
    if settings.llm_provider == "openai":
        if not settings.openai_api_key:
            raise RuntimeError("OPENAI_API_KEY is required for LLM provider")
        return OpenAILLMProvider(
            api_key=settings.openai_api_key,
            prompt=prompt,
            model=settings.openai_llm_model,
        )
    raise ValueError(f"Unsupported LLM provider: {settings.llm_provider}")
