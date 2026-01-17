from __future__ import annotations

import os
from dataclasses import dataclass

import boto3
from botocore.client import Config
from django.conf import settings


@dataclass(frozen=True)
class PresignedPutUrl:
    object_key: str
    url: str
    headers: dict[str, str]


def _s3_client():
    if not settings.S3_BUCKET_NAME:
        raise ValueError("S3_BUCKET_NAME is not configured")
    if not settings.S3_ACCESS_KEY_ID or not settings.S3_SECRET_ACCESS_KEY:
        raise ValueError("S3 credentials are not configured")

    return boto3.client(
        "s3",
        endpoint_url=settings.S3_ENDPOINT_URL or None,
        region_name=settings.S3_REGION_NAME or None,
        aws_access_key_id=settings.S3_ACCESS_KEY_ID,
        aws_secret_access_key=settings.S3_SECRET_ACCESS_KEY,
        config=Config(signature_version="s3v4"),
    )


def presign_put_object(*, object_key: str, content_type: str, expires_in_seconds: int = 900) -> PresignedPutUrl:
    """
    Returns a presigned URL for PUT uploads directly from the frontend.
    """
    client = _s3_client()
    url = client.generate_presigned_url(
        ClientMethod="put_object",
        Params={
            "Bucket": settings.S3_BUCKET_NAME,
            "Key": object_key,
            "ContentType": content_type,
        },
        ExpiresIn=expires_in_seconds,
    )
    return PresignedPutUrl(object_key=object_key, url=url, headers={"Content-Type": content_type})

