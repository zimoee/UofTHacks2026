from __future__ import annotations

import uuid

from django.contrib.auth import authenticate, get_user_model
from django.db import transaction
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from rest_framework import permissions, status, viewsets
from rest_framework.authtoken.models import Token
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response

from api.models import Interview, InterviewQuestion, Job, PersonalityProfile
from api.serializers import (
    CreateInterviewSerializer,
    InterviewSerializer,
    JobSerializer,
    PersonalityProfileSerializer,
    UserSerializer,
)
from api.services.ai import generate_behavioral_questions
from api.services.storage import presign_put_object
from api.tasks import process_interview

User = get_user_model()


@api_view(["GET"])
@permission_classes([permissions.AllowAny])
def health(_request):
    return Response({"ok": True})


@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def register(request):
    username = (request.data.get("username") or "").strip()
    email = (request.data.get("email") or "").strip()
    password = request.data.get("password") or ""
    if not username or not password:
        return Response({"detail": "username and password are required"}, status=status.HTTP_400_BAD_REQUEST)

    if User.objects.filter(username=username).exists():
        return Response({"detail": "username already exists"}, status=status.HTTP_400_BAD_REQUEST)

    user = User.objects.create_user(username=username, email=email, password=password)
    Token.objects.filter(user=user).delete()
    token = Token.objects.create(user=user)
    return Response({"token": token.key, "user": UserSerializer(user).data})


@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def login(request):
    username = (request.data.get("username") or "").strip()
    password = request.data.get("password") or ""
    user = authenticate(username=username, password=password)
    if not user:
        return Response({"detail": "invalid credentials"}, status=status.HTTP_400_BAD_REQUEST)
    token, _ = Token.objects.get_or_create(user=user)
    return Response({"token": token.key, "user": UserSerializer(user).data})


@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def dev_login(request):
    """
    Development helper: returns a token for a stable demo user without a password flow.
    Disable/remove for production.
    """
    username = (request.data.get("username") or "demo").strip() or "demo"
    user, _ = User.objects.get_or_create(username=username, defaults={"email": f"{username}@example.com"})
    token, _ = Token.objects.get_or_create(user=user)
    PersonalityProfile.objects.get_or_create(user=user, defaults={"traits": {"openness": 0.7, "conscientiousness": 0.6}})
    return Response({"token": token.key, "user": UserSerializer(user).data})


class JobViewSet(viewsets.ModelViewSet):
    serializer_class = JobSerializer

    def get_queryset(self):
        return Job.objects.filter(user=self.request.user).order_by("-created_at")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class PersonalityProfileViewSet(viewsets.ModelViewSet):
    serializer_class = PersonalityProfileSerializer

    def get_queryset(self):
        return PersonalityProfile.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class InterviewViewSet(viewsets.ModelViewSet):
    serializer_class = InterviewSerializer

    def get_queryset(self):
        return Interview.objects.filter(user=self.request.user).select_related("job").prefetch_related("questions")

    def create(self, request, *args, **kwargs):
        payload = CreateInterviewSerializer(data=request.data)
        payload.is_valid(raise_exception=True)

        job_url = payload.validated_data.get("job_url")
        title = payload.validated_data.get("title", "")
        company = payload.validated_data.get("company", "")

        with transaction.atomic():
            job = None
            if job_url:
                job = Job.objects.create(user=request.user, url=job_url, title=title, company=company)

            interview = Interview.objects.create(user=request.user, job=job, status=Interview.Status.CREATED)

            generated = generate_behavioral_questions(job_url=job_url, company=company, title=title)
            for idx, q in enumerate(generated.questions):
                InterviewQuestion.objects.create(
                    interview=interview,
                    order=idx,
                    prompt=q.get("prompt", ""),
                    competency=q.get("competency", ""),
                )
            interview.status = Interview.Status.QUESTIONS_READY
            interview.save(update_fields=["status", "updated_at"])

        return Response(InterviewSerializer(interview).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["POST"])
    def presign_upload(self, request, pk=None):
        interview: Interview = self.get_object()

        content_type = (request.data.get("content_type") or "video/webm").strip()
        ext = "webm" if "webm" in content_type else "mp4"
        object_key = f"interviews/{interview.user_id}/{interview.id}/{uuid.uuid4()}.{ext}"

        # If S3 isn't configured, fall back to a local multipart upload endpoint (dev-friendly, no Docker/S3 needed).
        try:
            presigned = presign_put_object(object_key=object_key, content_type=content_type, expires_in_seconds=900)
        except Exception:
            return Response(
                {
                    "mode": "local",
                    "upload_url": f"/api/interviews/{interview.id}/upload_local/",
                }
            )

        interview.video_object_key = presigned.object_key
        interview.video_mime_type = content_type
        interview.status = Interview.Status.CREATED
        interview.save(update_fields=["video_object_key", "video_mime_type", "status", "updated_at"])

        return Response({"mode": "s3", "object_key": presigned.object_key, "url": presigned.url, "headers": presigned.headers})

    @action(detail=True, methods=["POST"])
    def upload_local(self, request, pk=None):
        """
        Dev fallback: accept multipart upload and store in MEDIA_ROOT via Django's storage.
        Frontend should call this only when presign_upload returns mode=local.
        """
        interview: Interview = self.get_object()
        file = request.FILES.get("file")
        if not file:
            return Response({"detail": "Missing multipart file field 'file'."}, status=status.HTTP_400_BAD_REQUEST)

        content_type = getattr(file, "content_type", "") or "application/octet-stream"
        ext = "webm" if "webm" in content_type else "mp4"
        object_key = f"local/interviews/{interview.user_id}/{interview.id}/{uuid.uuid4()}.{ext}"
        saved_path = default_storage.save(object_key, ContentFile(file.read()))

        interview.video_object_key = saved_path
        interview.video_mime_type = content_type
        interview.video_size_bytes = getattr(file, "size", None)
        interview.status = Interview.Status.UPLOADED
        interview.save(
            update_fields=["video_object_key", "video_mime_type", "video_size_bytes", "status", "updated_at"]
        )
        process_interview.delay(str(interview.id))

        return Response({"uploaded": True, "object_key": saved_path, "queued": True, "interview_id": str(interview.id)})

    @action(detail=True, methods=["POST"])
    def submit(self, request, pk=None):
        interview: Interview = self.get_object()
        if not interview.video_object_key:
            return Response({"detail": "Upload video first."}, status=status.HTTP_400_BAD_REQUEST)

        interview.video_size_bytes = request.data.get("video_size_bytes") or interview.video_size_bytes
        interview.status = Interview.Status.UPLOADED
        interview.save(update_fields=["video_size_bytes", "status", "updated_at"])

        process_interview.delay(str(interview.id))
        return Response({"queued": True, "interview_id": str(interview.id)})

