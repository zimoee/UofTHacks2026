from __future__ import annotations

import json
from dataclasses import dataclass

from django.conf import settings


@dataclass(frozen=True)
class GeneratedQuestions:
    questions: list[dict]


def generate_behavioral_questions(*, job_url: str | None, company: str | None, title: str | None) -> GeneratedQuestions:
    """
    Boilerplate placeholder for OpenAI-powered question generation.
    Replace the stub below with real OpenAI calls (settings.OPENAI_API_KEY).
    """
    _ = settings.OPENAI_API_KEY  # wired via env; intentionally unused in stub

    base = []
    if company or title:
        base.append(f"Role context: {company or ''} {title or ''}".strip())
    if job_url:
        base.append(f"Job link: {job_url}")

    context = " | ".join(base) if base else "General behavioral interview"
    questions = [
        {"prompt": f"Tell me about a time you handled conflict on a team. ({context})", "competency": "Conflict resolution"},
        {"prompt": f"Describe a time you led without authority. ({context})", "competency": "Leadership"},
        {"prompt": f"Tell me about a time you failed and what you learned. ({context})", "competency": "Growth mindset"},
        {"prompt": f"Give an example of navigating ambiguity under time pressure. ({context})", "competency": "Execution"},
    ]
    return GeneratedQuestions(questions=questions)


def analyze_transcript_for_feedback(*, transcript: str) -> dict:
    """
    Boilerplate placeholder for GPT STAR analysis / strengths / weaknesses.
    """
    _ = settings.OPENAI_API_KEY  # wired via env; intentionally unused in stub

    return {
        "summary": "Stub feedback: replace with GPT STAR analysis.",
        "strengths": [
            "Clear structure (Situation/Task/Action/Result) in parts of the response",
            "Concise communication",
        ],
        "weaknesses": [
            "Add more quantifiable outcomes (metrics/impact)",
            "Tighten the 'Task' portion to clarify ownership",
        ],
        "coaching": {
            "star": {
                "situation": "Where/when it happened (1–2 sentences).",
                "task": "Your responsibility / objective.",
                "action": "What you did (specific decisions).",
                "result": "Outcome with numbers + reflection.",
            }
        },
        "raw_transcript_length": len(transcript or ""),
    }


def score_job_fit(*, traits: dict, job: dict) -> dict:
    """
    Boilerplate placeholder for identity/personality → job/company fit scoring.
    """
    _ = settings.OPENAI_API_KEY  # wired via env; intentionally unused in stub

    return {
        "score": 0.72,
        "rationale": "Stub fit scoring: replace with GPT reasoning using traits + job/company signals.",
        "traits_used": traits,
        "job_used": job,
    }

