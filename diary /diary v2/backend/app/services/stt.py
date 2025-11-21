from __future__ import annotations

"""Speech-to-text service wrappers.

This module keeps the integration surface tiny so it is easy to swap mock and
real providers. A future implementation will plug in an actual STT vendor.
"""

from typing import Optional

from .providers import STTProvider, build_stt_provider


class TranscriptionError(RuntimeError):
    """Raised when the STT provider fails."""


def transcribe_audio(file_path: str) -> str:
    """Return a transcript for the audio saved at *file_path*.

    The active provider is selected via settings (mock vs. Whisper/OpenAI).
    """

    provider = _get_provider()
    try:
        return provider.transcribe(file_path)
    except (NotImplementedError, RuntimeError, OSError) as exc:
        raise TranscriptionError(str(exc)) from exc


_provider_cache: Optional[STTProvider] = None


def _get_provider() -> STTProvider:
    global _provider_cache
    if _provider_cache is None:
        _provider_cache = build_stt_provider()
    return _provider_cache
