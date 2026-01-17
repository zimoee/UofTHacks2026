from __future__ import annotations

from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import Interview, InterviewQuestion, InterviewResponse, Job, PersonalityProfile

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "username", "email")


class JobSerializer(serializers.ModelSerializer):
    class Meta:
        model = Job
        fields = ("id", "url", "title", "company", "location", "description", "created_at")
        read_only_fields = ("id", "created_at")


class PersonalityProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = PersonalityProfile
        fields = ("id", "traits", "updated_at")
        read_only_fields = ("id", "updated_at")


class InterviewQuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = InterviewQuestion
        fields = ("id", "prompt", "competency", "order", "created_at")
        read_only_fields = ("id", "created_at")


class InterviewResponseSerializer(serializers.ModelSerializer):
    class Meta:
        model = InterviewResponse
        fields = ("id", "question", "transcript_excerpt", "start_ms", "end_ms", "ai_feedback", "created_at")
        read_only_fields = ("id", "created_at")


class InterviewSerializer(serializers.ModelSerializer):
    questions = InterviewQuestionSerializer(many=True, read_only=True)
    job = JobSerializer(read_only=True)
    job_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)

    class Meta:
        model = Interview
        fields = (
            "id",
            "status",
            "job",
            "job_id",
            "video_object_key",
            "video_mime_type",
            "video_size_bytes",
            "transcript_text",
            "ai_feedback",
            "personality_fit",
            "generated_questions",
            "questions",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "created_at",
            "updated_at",
            "video_object_key",
            "transcript_text",
            "ai_feedback",
            "personality_fit",
            "generated_questions",
        )


class CreateInterviewSerializer(serializers.Serializer):
    job_url = serializers.URLField(required=False)
    title = serializers.CharField(required=False, allow_blank=True)
    company = serializers.CharField(required=False, allow_blank=True)

