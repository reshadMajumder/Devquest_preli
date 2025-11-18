from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    # Fields shown in the list page
    list_display = (
        "email",
        "full_name",
        "student_id",
        "is_email_verified",
        "exam_attempted",
        "exam_marks",
        "date_joined",
    )

    # Filters on the right side
    list_filter = (
        "is_email_verified",
        "exam_attempted",
        "is_active",
        "is_staff",
    )

    # Search bar (top)
    search_fields = (
        "email",
        "student_id",
        "full_name",
    )

    # Default ordering
    ordering = (
        "-exam_attempted",
        "-exam_marks",
        "-date_joined",
    )

    # Fields editable inside the admin form
    fieldsets = (
        ("Login Credentials", {
            "fields": ("email", "password")
        }),
        ("Personal Info", {
            "fields": ("full_name", "whatsapp_number", "student_id")
        }),
        ("Verification", {
            "fields": ("is_email_verified", "otp")
        }),
        ("Exam Information", {
            "fields": ("exam_attempted", "exam_marks", "exam_answers")
        }),
        ("Permissions", {
            "fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions")
        }),
        ("Important Dates", {
            "fields": ("last_login", "date_joined")
        }),
    )

    # For creating a new user inside admin
    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": ("email", "password1", "password2"),
        }),
    )

    # Disable editing exam_answers directly (optional but recommended)
    readonly_fields = ("exam_answers", "date_joined", "last_login")
