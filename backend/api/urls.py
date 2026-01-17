from django.urls import include, path
from rest_framework.routers import DefaultRouter

from api.views import InterviewViewSet, JobViewSet, PersonalityProfileViewSet, dev_login, health, login, register

router = DefaultRouter()
router.register(r"jobs", JobViewSet, basename="job")
router.register(r"interviews", InterviewViewSet, basename="interview")
router.register(r"personality", PersonalityProfileViewSet, basename="personality")

urlpatterns = [
    path("health/", health),
    path("auth/register/", register),
    path("auth/login/", login),
    path("auth/dev-login/", dev_login),
    path("", include(router.urls)),
]

