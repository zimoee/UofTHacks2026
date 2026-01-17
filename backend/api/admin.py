from django.contrib import admin

from .models import Interview, InterviewQuestion, InterviewResponse, Job, PersonalityProfile


@admin.register(Job)
class JobAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "company", "title", "created_at")
    search_fields = ("company", "title", "url", "user__username", "user__email")


@admin.register(PersonalityProfile)
class PersonalityProfileAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "updated_at")
    search_fields = ("user__username", "user__email")


class InterviewQuestionInline(admin.TabularInline):
    model = InterviewQuestion
    extra = 0


@admin.register(Interview)
class InterviewAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "status", "created_at", "updated_at")
    list_filter = ("status",)
    search_fields = ("user__username", "user__email", "job__company", "job__title")
    inlines = (InterviewQuestionInline,)


@admin.register(InterviewQuestion)
class InterviewQuestionAdmin(admin.ModelAdmin):
    list_display = ("id", "interview", "order", "competency", "created_at")
    search_fields = ("prompt", "competency")


@admin.register(InterviewResponse)
class InterviewResponseAdmin(admin.ModelAdmin):
    list_display = ("id", "question", "created_at")

