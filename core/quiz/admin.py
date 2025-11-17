# quiz/admin.py
from django.contrib import admin
from .models import QuizQuestion

@admin.register(QuizQuestion)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ('id', 'text_short', 'created_at')
    readonly_fields = ('created_at',)
    search_fields = ('text',)
    list_per_page = 50

    def text_short(self, obj):
        return obj.text[:80]
    text_short.short_description = "Question"
