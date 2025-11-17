from django.urls import path
from .views import (
    QuestionListCreateAPIView,
    QuestionRetrieveUpdateDestroyAPIView,
    ExamineeQuestionListAPIView,
    SubmitExamAPIView,
    SubmitExamResultAPIView,
)

urlpatterns = [
    # Admin URLs for managing questions
    path('admin/questions/', QuestionListCreateAPIView.as_view(), name='admin-question-list-create'),
    path('admin/questions/<int:pk>/', QuestionRetrieveUpdateDestroyAPIView.as_view(), name='admin-question-detail'),

    # Examinee URLs for taking the exam
    path('exam/questions/', ExamineeQuestionListAPIView.as_view(), name='examinee-question-list'),
    path('exam/submit/', SubmitExamAPIView.as_view(), name='exam-submit'),
    path('v2/exam/submit/', SubmitExamResultAPIView.as_view(), name='exam-result'),
]
