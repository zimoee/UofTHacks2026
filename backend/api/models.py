from __future__ import annotations

import uuid

from django.conf import settings
from django.db import models


class Job(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="jobs")
    url = models.URLField()
    title = models.CharField(max_length=255, blank=True)
    company = models.CharField(max_length=255, blank=True)
    location = models.CharField(max_length=255, blank=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [models.Index(fields=["user", "created_at"])]

    def __str__(self) -> str:
        return f"{self.company} — {self.title}".strip(" —")


class PersonalityProfile(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="personality_profile")
    traits = models.JSONField(default=dict, blank=True)  # JSONB on Postgres
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self) -> str:
        return f"PersonalityProfile({self.user_id})"


class Interview(models.Model):
    class Status(models.TextChoices):
        CREATED = "created", "Created"
        QUESTIONS_READY = "questions_ready", "Questions Ready"
        UPLOADED = "uploaded", "Uploaded"
        PROCESSING = "processing", "Processing"
        COMPLETE = "complete", "Complete"
        FAILED = "failed", "Failed"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="interviews")
    job = models.ForeignKey(Job, on_delete=models.SET_NULL, null=True, blank=True, related_name="interviews")
    status = models.CharField(max_length=32, choices=Status.choices, default=Status.CREATED)

    video_object_key = models.CharField(max_length=1024, blank=True)
    video_mime_type = models.CharField(max_length=128, blank=True)
    video_size_bytes = models.BigIntegerField(null=True, blank=True)

    transcript_text = models.TextField(blank=True)
    ai_feedback = models.JSONField(default=dict, blank=True)  # JSONB on Postgres
    personality_fit = models.JSONField(default=dict, blank=True)  # JSONB on Postgres
    generated_questions = models.JSONField(default=list, blank=True)  # raw structured output from LLM

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=["user", "created_at"]),
            models.Index(fields=["status", "updated_at"]),
        ]

    def __str__(self) -> str:
        return f"Interview({self.id})"


class InterviewQuestion(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    interview = models.ForeignKey(Interview, on_delete=models.CASCADE, related_name="questions")
    prompt = models.TextField()
    competency = models.CharField(max_length=255, blank=True)
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["order", "created_at"]
        indexes = [models.Index(fields=["interview", "order"])]

    def __str__(self) -> str:
        return f"Q{self.order}: {self.prompt[:40]}"


class InterviewResponse(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    question = models.ForeignKey(InterviewQuestion, on_delete=models.CASCADE, related_name="responses")
    transcript_excerpt = models.TextField(blank=True)
    start_ms = models.PositiveIntegerField(null=True, blank=True)
    end_ms = models.PositiveIntegerField(null=True, blank=True)
    ai_feedback = models.JSONField(default=dict, blank=True)  # per-answer JSONB feedback
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return f"Response({self.id})"

