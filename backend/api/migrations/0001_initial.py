from __future__ import annotations

import uuid

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="Job",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("url", models.URLField()),
                ("title", models.CharField(blank=True, max_length=255)),
                ("company", models.CharField(blank=True, max_length=255)),
                ("location", models.CharField(blank=True, max_length=255)),
                ("description", models.TextField(blank=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "user",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="jobs", to=settings.AUTH_USER_MODEL),
                ),
            ],
        ),
        migrations.CreateModel(
            name="Interview",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("created", "Created"),
                            ("questions_ready", "Questions Ready"),
                            ("uploaded", "Uploaded"),
                            ("processing", "Processing"),
                            ("complete", "Complete"),
                            ("failed", "Failed"),
                        ],
                        default="created",
                        max_length=32,
                    ),
                ),
                ("video_object_key", models.CharField(blank=True, max_length=1024)),
                ("video_mime_type", models.CharField(blank=True, max_length=128)),
                ("video_size_bytes", models.BigIntegerField(blank=True, null=True)),
                ("transcript_text", models.TextField(blank=True)),
                ("ai_feedback", models.JSONField(blank=True, default=dict)),
                ("personality_fit", models.JSONField(blank=True, default=dict)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "job",
                    models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="interviews", to="api.job"),
                ),
                (
                    "user",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="interviews", to=settings.AUTH_USER_MODEL),
                ),
            ],
        ),
        migrations.CreateModel(
            name="PersonalityProfile",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("traits", models.JSONField(blank=True, default=dict)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "user",
                    models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name="personality_profile", to=settings.AUTH_USER_MODEL),
                ),
            ],
        ),
        migrations.CreateModel(
            name="InterviewQuestion",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("prompt", models.TextField()),
                ("competency", models.CharField(blank=True, max_length=255)),
                ("order", models.PositiveIntegerField(default=0)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "interview",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="questions", to="api.interview"),
                ),
            ],
            options={"ordering": ["order", "created_at"]},
        ),
        migrations.CreateModel(
            name="InterviewResponse",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("transcript_excerpt", models.TextField(blank=True)),
                ("start_ms", models.PositiveIntegerField(blank=True, null=True)),
                ("end_ms", models.PositiveIntegerField(blank=True, null=True)),
                ("ai_feedback", models.JSONField(blank=True, default=dict)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "question",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="responses", to="api.interviewquestion"),
                ),
            ],
        ),
        migrations.AddIndex(
            model_name="job",
            index=models.Index(fields=["user", "created_at"], name="api_job_user_id_59f74a_idx"),
        ),
        migrations.AddIndex(
            model_name="interview",
            index=models.Index(fields=["user", "created_at"], name="api_interview_user_id_b8b91d_idx"),
        ),
        migrations.AddIndex(
            model_name="interview",
            index=models.Index(fields=["status", "updated_at"], name="api_interview_status_245d2d_idx"),
        ),
        migrations.AddIndex(
            model_name="interviewquestion",
            index=models.Index(fields=["interview", "order"], name="api_intervie_intervi_60b888_idx"),
        ),
    ]

