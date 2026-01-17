from __future__ import annotations

from dataclasses import dataclass

from django.conf import settings


@dataclass(frozen=True)
class TranscriptResult:
    transcript: str


def transcribe_video(*, object_key: str) -> TranscriptResult:
    """
    Boilerplate placeholder for TwelveLabs transcription.

    Replace with a real TwelveLabs integration using settings.TWELVELABS_API_KEY.
    """
    _ = settings.TWELVELABS_API_KEY  # wired via env; intentionally unused in stub
    return TranscriptResult(transcript=f"Stub transcript for uploaded object {object_key}.")

