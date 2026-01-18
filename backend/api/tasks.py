from __future__ import annotations

from celery import shared_task
from django.db import transaction

from api.models import Interview, InterviewQuestion
from api.services.ai import classify_archetype, generate_interview_feedback, score_job_fit
from api.services.twelvelabs import DEFAULT_ANALYSIS_PROMPT, analyze_video_from_storage


@shared_task(bind=True, max_retries=2, default_retry_delay=10)
def process_interview(self, interview_id: str) -> None:
    try:
        interview = Interview.objects.select_related("job", "user").get(id=interview_id)
    except Interview.DoesNotExist:
        return

    if not interview.video_object_key:
        interview.status = Interview.Status.FAILED
        interview.ai_feedback = {"error": "No video_object_key on interview; cannot process."}
        interview.save(update_fields=["status", "ai_feedback", "updated_at"])
        return

    try:
        interview.status = Interview.Status.PROCESSING
        interview.save(update_fields=["status", "updated_at"])

        first_question = (
            InterviewQuestion.objects.filter(interview=interview).order_by("order").values_list("prompt", flat=True).first()
        )
        analysis_prompt = DEFAULT_ANALYSIS_PROMPT
        if first_question:
            analysis_prompt = f"Question: {first_question}\n\n{DEFAULT_ANALYSIS_PROMPT}"

        result = analyze_video_from_storage(
            object_key=interview.video_object_key,
            filename=interview.video_object_key.split("/")[-1],
            prompt=analysis_prompt,
        )
        transcript = result.transcript
        feedback_details = generate_interview_feedback(transcript=transcript, analysis=result.analysis)
        feedback = {
            "summary": result.analysis,
            "strengths": feedback_details.get("strengths", []),
            "weaknesses": feedback_details.get("weaknesses", []),
        }
        archetype = classify_archetype(transcript=transcript, analysis=result.analysis)

        traits = getattr(getattr(interview.user, "personality_profile", None), "traits", {}) or {}
        job_payload = {
            "url": interview.job.url if interview.job else "",
            "company": interview.job.company if interview.job else "",
            "title": interview.job.title if interview.job else "",
        }
        fit = score_job_fit(traits=traits, job=job_payload)

        with transaction.atomic():
            interview.transcript_text = transcript
            interview.ai_feedback = feedback
            interview.personality_fit = {"job_fit": fit, "archetype": archetype}
            interview.status = Interview.Status.COMPLETE
            interview.save(
                update_fields=["transcript_text", "ai_feedback", "personality_fit", "status", "updated_at"]
            )
    except Exception as exc:  # noqa: BLE001 - boilerplate task wrapper
        interview.status = Interview.Status.FAILED
        interview.ai_feedback = {"error": str(exc)}
        interview.save(update_fields=["status", "ai_feedback", "updated_at"])
        raise
