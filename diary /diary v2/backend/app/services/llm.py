from __future__ import annotations

"""LLM analysis service built on pluggable providers."""

import logging
from typing import Optional

from openai import OpenAI, OpenAIError

from ..core.config import get_settings
from .providers import LLMProvider, build_llm_provider

logger = logging.getLogger(__name__)

LLM_PROMPT = """You are an assistant that analyzes personal voice diary transcripts.
Return a valid JSON with fields:

- title – short, 3–7 words, like a journal entry title.
- mood_label – one word in English describing the dominant mood (e.g. "anxious", "calm", "angry", "sad", "hopeful").
- tags – 2–6 short tags in English (1–2 words each), summarizing topics and feelings (e.g. "работа", "усталость", "самокритика").
- insights – 2–3 short supportive observations in language of the transcript (1–2 sentences each), without medical terms or diagnoses.

Be gentle and neutral, like a thoughtful friend.

Transcript (in language that is spoken)):
{transcript}
"""

TRANSCRIPT_FORMATTING_PROMPT = """You receive a raw transcript from automatic speech recognition.

The text may contain multiple languages in one message (code-switching).

Your job:
- Preserve every word, in every language, exactly as in the original.
- Do NOT translate anything.
- Do NOT drop sentences or merge languages.
- Do NOT summarize or shorten the content.
- Only:
  - fix basic spacing issues,
  - add natural punctuation and capitalization,
  - optionally use ALL CAPS if the speaker is shouting.
- If the speaker switches from English to Russian or vice versa, keep that switch exactly in the output.
- If you are unsure, prefer to keep the text as-is instead of modifying it.

CRITICAL RULES:
- If the original contains "Today I feel really tired и вообще вымотался за неделю", 
  the output MUST contain both English ("Today I feel really tired") AND Russian ("и вообще вымотался за неделю").
- Do NOT translate "Today I feel really tired" into Russian.
- Do NOT translate "и вообще вымотался за неделю" into English.
- Do NOT drop either language segment.
- Do NOT rewrite, summarize, or make the text more concise.
- Preserve code-switching exactly as spoken.

Fix grammar, spelling, and punctuation according to the conventions of EACH language used.
Smooth out stutters and filler words unless meaningful.
Use punctuation to reflect natural intonation (long pauses → "…", abrupt shifts → "—").
Do NOT add labels like (laughs), (sighs), (pause).
Do NOT add commentary, explanations, or interpretations.

Output ONLY the final cleaned diary text with ALL languages preserved in their original order, nothing else."""


def analyze_transcript(transcript: str) -> dict:
    """Return structured data extracted from *transcript*.

    The active provider is chosen via environment configuration (mock vs. OpenAI).
    """

    provider = _get_provider()
    return provider.analyze(transcript)


def format_transcript(raw_text: str, language: str | None = None) -> str:
    """Format raw STT transcript using LLM post-processing.
    
    Applies transcription formatting rules (punctuation, casing, emphasis, etc.)
    while preserving the original language and emotional tone.
    
    Args:
        raw_text: Raw transcript from STT provider
        language: Optional language name (currently unused, preserved for future use)
    
    Returns:
        Formatted, cleaned transcript text (or raw text if formatting is disabled)
    
    Raises:
        RuntimeError: If LLM formatting fails
    """
    settings = get_settings()
    
    # Safety bypass: if formatting is disabled, return raw transcript as-is
    if not settings.transcript_formatting_enabled:
        logger.info("Transcript formatting is disabled, returning raw transcript")
        return raw_text.strip()
    
    # Use the prompt as-is (it already instructs to preserve original language)
    prompt = TRANSCRIPT_FORMATTING_PROMPT
    
    # For mock provider, return cleaned version of mock text
    if settings.llm_provider == "mock":
        # Simple mock formatting: capitalize first letter, add period if missing
        formatted = raw_text.strip()
        if formatted and not formatted.endswith((".", "!", "?", "…")):
            formatted += "."
        if formatted:
            formatted = formatted[0].upper() + formatted[1:] if len(formatted) > 1 else formatted.upper()
        return formatted
    
    # Use OpenAI for real formatting
    if settings.llm_provider == "openai":
        if not settings.openai_api_key:
            logger.warning("No OpenAI API key, returning raw transcript without formatting")
            return raw_text
        
        try:
            client = OpenAI(api_key=settings.openai_api_key)
            completion = client.chat.completions.create(
                model=settings.openai_llm_model,
                temperature=0.1,  # Very low temperature for maximum consistency and preservation
                messages=[
                    {"role": "system", "content": prompt},
                    {"role": "user", "content": raw_text},
                ],
            )
            
            formatted = completion.choices[0].message.content
            if not formatted:
                logger.warning("LLM returned empty formatted text, using raw transcript")
                return raw_text
            
            # Do NOT aggressively trim - preserve the full text
            formatted = formatted.strip()
            
            # Log if significant content was lost (safety check)
            if len(formatted) < len(raw_text) * 0.5:
                logger.warning(
                    f"Formatted transcript is significantly shorter than raw: "
                    f"raw={len(raw_text)} chars, formatted={len(formatted)} chars. "
                    f"This may indicate content was dropped."
                )
            
            return formatted
            
        except OpenAIError as exc:
            logger.exception(f"OpenAI formatting failed: {exc}")
            # Fallback to raw text if formatting fails
            logger.warning("Falling back to raw transcript due to formatting error")
            return raw_text
        except Exception as exc:
            logger.exception(f"Unexpected error during transcript formatting: {exc}")
            return raw_text
    
    # Unknown provider, return raw
    logger.warning(f"Unknown LLM provider '{settings.llm_provider}', returning raw transcript")
    return raw_text


_provider_cache: Optional[LLMProvider] = None


def _get_provider() -> LLMProvider:
    global _provider_cache
    if _provider_cache is None:
        _provider_cache = build_llm_provider(prompt=LLM_PROMPT)
    return _provider_cache
