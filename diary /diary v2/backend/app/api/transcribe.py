"""High-quality transcription endpoint with audio format conversion for Whisper."""

from __future__ import annotations

import logging
import os
import shutil
from pathlib import Path
from tempfile import NamedTemporaryFile

import ffmpeg
from fastapi import APIRouter, File, HTTPException, UploadFile, status
from openai import OpenAIError

from ..core.config import get_settings
from ..schemas.transcribe import TranscribeResponse
from ..services.llm import format_transcript
from ..services.providers import build_stt_provider

logger = logging.getLogger(__name__)
__all__ = ["router"]

router = APIRouter()
settings = get_settings()

# Maximum file size: 50MB (reasonable for audio files)
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB in bytes


@router.post("/transcribe", response_model=TranscribeResponse)
def transcribe_audio(
    file: UploadFile = File(...),
):
    """Transcribe audio with optimal quality for Whisper.
    
    Accepts: WebM, M4A, MP3, WAV
    Converts to: 16kHz mono WAV for optimal Whisper quality
    Returns: JSON with formatted transcript and language
    
    Note: This endpoint only performs transcription and formatting. 
    Audio is temporary input only - not stored or persisted.
    Analysis is handled separately.
    """
    # Validate file extension
    if not file.filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Missing filename")
    
    file_ext = Path(file.filename).suffix.lower()
    allowed_extensions = {".webm", ".m4a", ".mp3", ".wav", ".mp4", ".mpeg", ".mpga"}
    
    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid audio format. Allowed: {', '.join(allowed_extensions)}",
        )
    
    # Validate file size
    if file.size and file.size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File too large. Maximum size is {MAX_FILE_SIZE / (1024 * 1024):.0f}MB",
        )

    input_path: str | None = None
    output_path: str | None = None
    
    try:
        # Save uploaded file to temporary location
        suffix = file_ext or ".webm"
        tmp_file = NamedTemporaryFile(delete=False, suffix=suffix)
        input_path = tmp_file.name
        
        logger.info(f"Received audio file: {file.filename}, size: {file.size}, saving to {input_path}")
        
        with tmp_file:
            shutil.copyfileobj(file.file, tmp_file)
        
        # Verify file exists and has content
        if not os.path.exists(input_path) or os.path.getsize(input_path) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded file is empty or invalid",
            )
        
        # Convert to 16kHz mono WAV for optimal Whisper quality
        output_path = input_path.rsplit(".", 1)[0] + ".wav"
        
        logger.info(f"Converting {input_path} to {output_path} (16kHz mono WAV)")
        
        try:
            (
                ffmpeg
                .input(input_path)
                .output(
                    output_path,
                    acodec="pcm_s16le",  # 16-bit PCM
                    ac=1,  # Mono channel
                    ar=16000,  # 16kHz sample rate
                    format="wav",
                )
                .overwrite_output()
                .run(quiet=True, capture_stderr=True)
            )
        except ffmpeg.Error as e:
            error_msg = e.stderr.decode() if e.stderr else str(e)
            logger.error(f"FFmpeg conversion failed: {error_msg}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Audio conversion failed: {error_msg}",
            ) from e
        
        if not os.path.exists(output_path) or os.path.getsize(output_path) == 0:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Audio conversion produced empty file",
            )
        
        # Transcribe using Whisper
        logger.info(f"Transcribing {output_path} with Whisper")
        
        try:
            stt_provider = build_stt_provider()
            raw_transcript = stt_provider.transcribe(output_path)
            logger.info(f"Raw transcription successful: {len(raw_transcript)} characters")
            
            # DEBUG: Log raw transcript to verify both languages are present
            logger.info(f"RAW_TRANSCRIPT: {raw_transcript}")
            
            # Validate transcript is not empty
            if not raw_transcript or not raw_transcript.strip():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Transcription produced empty result. Please check your audio file.",
                )
            
            # Post-process transcript with LLM formatting
            logger.info("Formatting transcript with LLM post-processing")
            formatted_transcript = format_transcript(raw_transcript, language=None)
            logger.info(f"Transcript formatting complete: {len(formatted_transcript)} characters")
            
            # DEBUG: Log formatted transcript to verify both languages are preserved
            logger.info(f"FORMATTED_TRANSCRIPT: {formatted_transcript}")
            
            # Validate formatted transcript is not empty
            if not formatted_transcript or not formatted_transcript.strip():
                logger.warning("Formatted transcript is empty, using raw transcript")
                formatted_transcript = raw_transcript.strip()
            
            return TranscribeResponse(
                text=formatted_transcript,
                transcript=formatted_transcript,  # Alias for backward compatibility
                language="auto",  # Whisper detects language automatically
            )
        except Exception as e:
            logger.exception("Whisper transcription failed")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Transcription failed: {str(e)}",
            ) from e
    
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logger.exception("Unexpected error in transcribe endpoint")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing audio: {str(e)}",
        ) from e
    
    finally:
        # Cleanup temporary files
        for path in [input_path, output_path]:
            if path and os.path.exists(path):
                try:
                    os.remove(path)
                    logger.debug(f"Cleaned up temp file: {path}")
                except Exception as e:
                    logger.warning(f"Failed to remove temp file {path}: {e}")

