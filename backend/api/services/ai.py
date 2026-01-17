from __future__ import annotations

from dataclasses import dataclass
import json

import requests
from django.conf import settings


@dataclass(frozen=True)
class GeneratedQuestions:
    questions: list[dict]

def _extract_json_from_text(text: str) -> str:
    """
    Gemini often returns fenced code blocks like ```json ... ```.
    This extracts the JSON payload (array/object) as a string.
    """
    t = (text or "").strip()
    if not t:
        return ""

    # Strip ```json fences if present
    if "```" in t:
        # Take the largest fenced block if possible
        parts = t.split("```")
        best = ""
        for i in range(1, len(parts), 2):
            block = parts[i].strip()
            # If it starts with "json", drop the first line
            if block.lower().startswith("json"):
                block = "\n".join(block.splitlines()[1:]).strip()
            if len(block) > len(best):
                best = block
        if best:
            t = best

    # Heuristic: slice from first { or [ to last } or ]
    start_candidates = [t.find("["), t.find("{")]
    start_candidates = [i for i in start_candidates if i != -1]
    if not start_candidates:
        return ""
    start = min(start_candidates)
    end_candidates = [t.rfind("]"), t.rfind("}")]
    end_candidates = [i for i in end_candidates if i != -1]
    if not end_candidates:
        return ""
    end = max(end_candidates)
    if end <= start:
        return ""
    return t[start : end + 1].strip()


def _gemini_generate_text(*, prompt: str) -> str:
    """
    Minimal Gemini API call via REST (no extra SDK).
    Docs: https://ai.google.dev/
    """
    if not settings.GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY is not configured")

    model = getattr(settings, "GEMINI_MODEL", "gemini-2.5-flash")
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
    resp = requests.post(
        url,
        headers={
            "Content-Type": "application/json",
            "x-goog-api-key": settings.GEMINI_API_KEY,
        },
        json={
            "contents": [{"parts": [{"text": prompt}]}],
            # Keep output stable-ish for structured tasks
            "generationConfig": {"temperature": 0.4},
        },
        timeout=60,
    )
    resp.raise_for_status()
    data = resp.json()
    # Best-effort extraction of the first candidate text
    return (
        data.get("candidates", [{}])[0]
        .get("content", {})
        .get("parts", [{}])[0]
        .get("text", "")
        .strip()
    )


def _llm_generate_text(*, prompt: str) -> str:
    provider = getattr(settings, "AI_PROVIDER", "openai")
    if provider == "gemini":
        return _gemini_generate_text(prompt=prompt)
    # Default: keep OpenAI as stubbed boilerplate (safe without keys)
    return ""


def generate_behavioral_questions(
    *, job_url: str | None, company: str | None, title: str | None, job_description: str | None = None
) -> GeneratedQuestions:
    """
    Generates behavioral questions. If AI_PROVIDER=gemini and GEMINI_API_KEY is set,
    it will use Gemini; otherwise it falls back to a deterministic stub list.
    """
    has_context = any(
        [
            bool((job_url or "").strip()),
            bool((company or "").strip()),
            bool((title or "").strip()),
            bool((job_description or "").strip()),
        ]
    )

    # If the user provided no context, return general behavioral questions (no LLM call).
    if not has_context:
        questions = [
            {"prompt": "Tell me about a time you had to handle conflict on a team.", "competency": "Conflict resolution"},
            {"prompt": "Describe a time you took initiative without being asked.", "competency": "Ownership"},
            {"prompt": "Tell me about a time you made a mistake. What did you do next?", "competency": "Accountability"},
            {"prompt": "Give an example of working under a tight deadline.", "competency": "Execution"},
            {"prompt": "Tell me about a time you had to learn something quickly to succeed.", "competency": "Learning agility"},
            {"prompt": "Describe a time you influenced someone without authority.", "competency": "Influence"},
        ]
        return GeneratedQuestions(questions=questions)

    # Try LLM path first (optional)
    try:
        llm_out = _llm_generate_text(
            prompt=(
                "You are an interview coach. Generate exactly 6 behavioral interview questions tailored to the job.\n"
                "Return ONLY valid JSON (no markdown), as an array of objects.\n"
                "Schema for each item:\n"
                '{ "prompt": string, "competency": string, "why_this_matters": string, "good_signals": [string], "red_flags": [string] }\n'
                "Make prompts concise and role-specific; vary competencies.\n\n"
                f"Job URL: {job_url or ''}\nCompany: {company or ''}\nTitle: {title or ''}\n\n"
                f"Job description text:\n{job_description or ''}\n"
            )
        )
        if llm_out:
            import json

            payload = _extract_json_from_text(llm_out)
            if payload:
                parsed = json.loads(payload)
                if isinstance(parsed, list):
                    cleaned: list[dict] = []
                    for item in parsed:
                        if not isinstance(item, dict):
                            continue
                        prompt = str(item.get("prompt", "")).strip()
                        competency = str(item.get("competency", "")).strip()
                        if not prompt:
                            continue
                        cleaned.append(
                            {
                                "prompt": prompt,
                                "competency": competency,
                                "why_this_matters": str(item.get("why_this_matters", "")).strip(),
                                "good_signals": item.get("good_signals") if isinstance(item.get("good_signals"), list) else [],
                                "red_flags": item.get("red_flags") if isinstance(item.get("red_flags"), list) else [],
                            }
                        )
                    if cleaned:
                        return GeneratedQuestions(questions=cleaned)
    except Exception:
        pass

    base = []
    if company or title:
        base.append(f"Role context: {company or ''} {title or ''}".strip())
    if job_url:
        base.append(f"Job link: {job_url}")

    context = " | ".join(base) if base else "General behavioral interview"
    questions = [
        {"prompt": f"Tell me about a time you handled conflict on a team. ({context})", "competency": "Conflict resolution"},
        {"prompt": f"Describe a time you took ownership of a problem end-to-end. ({context})", "competency": "Ownership"},
        {"prompt": f"Tell me about a time you failed and what you learned. ({context})", "competency": "Growth mindset"},
        {"prompt": f"Give an example of navigating ambiguity under time pressure. ({context})", "competency": "Execution"},
        {"prompt": f"Describe a time you learned a new skill quickly to deliver results. ({context})", "competency": "Learning agility"},
        {"prompt": f"Tell me about a time you influenced a decision without authority. ({context})", "competency": "Influence"},
    ]
    return GeneratedQuestions(questions=questions)



def score_job_fit(*, traits: dict, job: dict) -> dict:
    """
    If AI_PROVIDER=gemini and GEMINI_API_KEY is set, uses Gemini; otherwise returns stub scoring.
    """
    try:
        llm_out = _llm_generate_text(
            prompt=(
                "Given personality traits JSON and a job JSON, produce a short rationale for fit. "
                "Return plain text (1-3 sentences).\n"
                f"Traits: {traits}\nJob: {job}\n"
            )
        )
        if llm_out:
            return {"score": 0.72, "rationale": llm_out, "traits_used": traits, "job_used": job}
    except Exception:
        pass

    return {
        "score": 0.72,
        "rationale": "Stub fit scoring: replace with GPT reasoning using traits + job/company signals.",
        "traits_used": traits,
        "job_used": job,
    }


def classify_archetype(*, transcript: str, analysis: str) -> dict:
    """
    If AI_PROVIDER=gemini and GEMINI_API_KEY is set, returns an archetype classification.
    """
    try:
        llm_out = _llm_generate_text(
            prompt=(
                "You are an interview analysis assistant. Classify the speaker into ONE archetype.\n"
                "Archetypes:\n"
                "- Bunny: The Self-Starter. Stories start with action: “I noticed… so I decided to…”, Emphasis on getting started, stepping up without being asked, Less time on planning, more on doing, Often first to volunteer or experiment.\n"
                "- Penguin: The Team Player. Frequent use of “we”, Describes collaboration, communication, and support, Talks about resolving conflict or aligning people, Credits teammates naturally.\n"
                "- Turtle: The Thoughtful Decision-Maker. Clearly explains why decisions were made, Mentions tradeoffs, risks, or constraints, Reflects on outcomes and lessons learned.\n"
                "- Cat: The Ownership-Driven Contributor. Strong “I” ownership of outcomes, Focus on quality, responsibility, and follow-through, Goes deep into what they did and why it mattered, Often discusses accountability or standards.\n\n"
                "Return ONLY valid JSON (no markdown) with this schema:\n"
                '{ "archetype": string, "rationale": string }\n\n'
                "Use the transcript and analysis below. Do not infer protected attributes.\n\n"
                f"Analysis:\n{analysis}\n\n"
                f"Transcript:\n{transcript}\n"
            )
        )
        if llm_out:
            payload = _extract_json_from_text(llm_out)
            if payload:
                parsed = json.loads(payload)
                archetype = str(parsed.get("archetype", "")).strip()
                rationale = str(parsed.get("rationale", "")).strip()
                if archetype:
                    return {"archetype": archetype, "rationale": rationale}
    except Exception:
        pass

    return {"archetype": "Unknown", "rationale": "No archetype classification available."}
