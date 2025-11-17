# quiz/urls.py
from django.urls import path
from .views import ExamQuestionsView, SubmitExamView

urlpatterns = [
    path('questions/', ExamQuestionsView.as_view(), name='exam-questions'),
    path('submit/', SubmitExamView.as_view(), name='exam-submit'),
]
