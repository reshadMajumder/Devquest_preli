from django.contrib import admin
from django import forms # Import forms
from .models import Question

class QuestionForm(forms.ModelForm):
    options = forms.CharField(widget=forms.Textarea(attrs={'rows': 4, 'cols': 80}), help_text="Enter options as a JSON list of strings, e.g., [\"Option A\", \"Option B\"]")

    class Meta:
        model = Question
        fields = '__all__'

@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    form = QuestionForm # Apply the custom form
    list_display = ('text', 'correct_answer_index', 'created_at', 'updated_at')
    search_fields = ('text',)
    list_filter = ('created_at', 'updated_at')
