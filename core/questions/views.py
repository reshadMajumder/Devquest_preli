from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAdminUser, IsAuthenticated
from .models import Question
from .serializers import QuestionSerializer, ExamineeQuestionSerializer, ReportQuestionSerializer
from django.db import transaction
import json

class QuestionListCreateAPIView(generics.ListCreateAPIView):
    queryset = Question.objects.all()
    serializer_class = QuestionSerializer
    permission_classes = [IsAdminUser] # Only admins can list/create questions

class QuestionRetrieveUpdateDestroyAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Question.objects.all()
    serializer_class = QuestionSerializer
    permission_classes = [IsAdminUser] # Only admins can retrieve/update/delete questions

class ExamineeQuestionListAPIView(generics.ListAPIView):
    queryset = Question.objects.all().order_by('?') # Order randomly for each examinee
    serializer_class = ExamineeQuestionSerializer
    permission_classes = [AllowAny] # Only authenticated users can get questions

    def list(self, request, *args, **kwargs):

        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        print("DEBUG: ExamineeQuestionListAPIView serializer.data:", serializer.data) # Debug print
        return Response(serializer.data)

class SubmitExamAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        user = request.user
        if user.exam_attempted:
            return Response({"detail": "You have already attempted the exam."}, status=status.HTTP_400_BAD_REQUEST)

        answers_data = request.data.get('answers', []) # Expects a list of {'question_id': id, 'selected_option_index': index}
        
        if not answers_data:
            return Response({"detail": "No answers submitted."}, status=status.HTTP_400_BAD_REQUEST)

        total_questions = Question.objects.count()
        correct_answers_count = 0
        processed_answers = [] # To store answers for the user's exam_answers field

        with transaction.atomic():
            for answer_entry in answers_data:
                question_id = answer_entry.get('question_id')
                selected_option_index = answer_entry.get('selected_option_index')

                try:
                    question = Question.objects.get(id=question_id)
                except Question.DoesNotExist:
                    # We can't create a report for a question that doesn't exist, so we skip it.
                    # The frontend should ideally not send invalid question_ids.
                    continue

                # options is a JSONField, so it's already a Python list, not a JSON string
                options_list = question.options if isinstance(question.options, list) else json.loads(question.options)
                question_data = ReportQuestionSerializer(question).data
                is_correct = False
                
                if selected_option_index is not None:
                    if 0 <= selected_option_index < len(options_list):
                        if selected_option_index == question.correct_answer_index:
                            is_correct = True
                            correct_answers_count += 1
                
                processed_answers.append({
                    'question': question_data,
                    'selectedAnswer': selected_option_index,
                    'isCorrect': is_correct
                })
            
            user.exam_attempted = True
            user.exam_marks = correct_answers_count
            user.exam_answers = json.dumps(processed_answers) # Store as JSON string
            user.save()

        return Response({
            "score": correct_answers_count,
            "totalQuestions": total_questions,
            "answeredQuestions": processed_answers
        }, status=status.HTTP_200_OK)


class SubmitExamResultAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        user = request.user
        exam_mark = request.data.get('exam_mark')
        exam_answers = request.data.get('exam_answers', []) # Expects a list of {'question_id': id, 'selected_option_index': index}

        if user.exam_attempted:
            return Response({"detail": "You have already attempted the exam."}, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate exam_mark is provided and is a valid integer
        if exam_mark is None:
            return Response({"detail": "exam_mark is required."}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            exam_mark = int(exam_mark)
            if exam_mark < 0:
                return Response({"detail": "exam_mark must be a non-negative integer."}, status=status.HTTP_400_BAD_REQUEST)
        except (ValueError, TypeError):
            return Response({"detail": "exam_mark must be a valid integer."}, status=status.HTTP_400_BAD_REQUEST)
        
        # Update user fields
        user.exam_marks = exam_mark
        user.exam_attempted = True
        
        # Try to serialize exam_answers, but ignore if there's a JSON error
        try:
            user.exam_answers = json.dumps(exam_answers) if exam_answers else json.dumps([])
        except (TypeError, ValueError) as e:
            # If JSON serialization fails, just save empty list and continue
            user.exam_answers = json.dumps([])
        
        user.save()
        
        return Response({"detail": "Exam result submitted successfully."}, status=status.HTTP_200_OK)