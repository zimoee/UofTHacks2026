from django.shortcuts import render
from rest_framework.decorators import api_view, permission_classes
from django.contrib.auth import get_user_model
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import IsAuthenticated, AllowAny
from api.services.clients import gemini#, twelve
import uuid

User=get_user_model()

@api_view(["POST"])
@permission_classes([AllowAny])
def register(request):
    username = (request.data.get("username") or "").strip()
    email = (request.data.get("email") or "").strip()
    password = request.data.get("password") or ""
    if not username or not password:
        return Response({"detail": "username and password are required"}, status=400)

    if User.objects.filter(username=username).exists():
        return Response({"detail": "username already exists"}, status=400)

    User.objects.create_user(username=username, email=email, password=password)

    return Response(status=200)

@api_view(['GET'])
@permission_classes([AllowAny])
def create_guest_user(request):
    username = f"guest_{uuid.uuid4().hex[:10]}"
    user = User.objects.create_user(username=username)
    refresh = RefreshToken.for_user(user)
    return Response({
        "access": str(refresh.access_token),
        "refresh": str(refresh),
    })
