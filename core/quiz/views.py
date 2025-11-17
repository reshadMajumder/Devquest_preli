# quiz/views.py
import json
from django.db import transaction
from django.db.models import F
from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import get_user_model
from rest_framework.permissions import AllowAny, IsAdminUser, IsAuthenticated

from .models import QuizQuestion
from .serializers import QuestionSerializer, SubmitAnswersSerializer

User = get_user_model()

class ExamQuestionsView(APIView):
    """
    GET: return all questions (without correct answer).
    Prevent access if user.exam_attempted is True.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if getattr(user, "exam_attempted", False):
            return Response({"detail": "You already attempted the exam."}, status=status.HTTP_403_FORBIDDEN)

        qs = QuizQuestion.objects.all()
        serializer = QuestionSerializer(qs, many=True)
        return Response({"questions": serializer.data}, status=status.HTTP_200_OK)

class SubmitExamView(APIView):
    """
    POST: Accepts {"answers": [{"q_id": 1, "ans": "A"}, ...]}
    - Validates input
    - Compares answers in an atomic transaction using select_for_update on user
    - Ignores invalid q_ids (but returns them in response)
    - Saves `exam_attempted`, `exam_marks`, `exam_answers` on user
    """
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        # Validate payload
        serializer = SubmitAnswersSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        answers = data['answers']

        # Lock the user row to prevent race conditions (user can't submit twice concurrently)
        try:
            locked_user = User.objects.select_for_update().get(pk=request.user.pk)
        except User.DoesNotExist:
            return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)

        if getattr(locked_user, "exam_attempted", False):
            return Response({"detail": "Exam already submitted."}, status=status.HTTP_403_FORBIDDEN)

        # Build dictionary of question objects for given q_ids (single query)
        q_id_list = [item['q_id'] for item in answers]
        questions = QuizQuestion.objects.filter(id__in=q_id_list)
        questions_map = {q.id: q for q in questions}

        total_marks = 0
        processed = []
        invalid_q_ids = []

        for item in answers:
            q_id = item['q_id']
            # Safety check: ensure ans is a string before calling upper()
            # Serializer validates this, but defensive check prevents AttributeError
            ans_value = item.get('ans')
            if ans_value is None:
                ans = None
            else:
                ans = str(ans_value).upper()

            # Skip if answer is None or invalid
            if ans is None:
                invalid_q_ids.append(q_id)
                processed.append({"q_id": q_id, "ans": None, "valid": False, "reason": "answer_is_null"})
                continue

            q = questions_map.get(q_id)
            if q is None:
                invalid_q_ids.append(q_id)
                # Still record provided answer for audit/debug
                processed.append({"q_id": q_id, "ans": ans, "valid": False, "reason": "question_not_found"})
                continue

            # Validate that question has a correct answer before comparing
            if not q.correct:
                processed.append({"q_id": q_id, "ans": ans, "valid": False, "reason": "question_has_no_correct_answer"})
                continue

            is_correct = (ans == q.correct.upper())
            if is_correct:
                total_marks += 1

            processed.append({
                "q_id": q_id,
                "ans": ans,
                "valid": True,
                "is_correct": is_correct
            })

        # Save result into user model (user has exam_attempted, exam_marks, exam_answers text)
        try:
            locked_user.exam_attempted = True
            locked_user.exam_marks = total_marks
            
            # Try to serialize exam_answers, but if JSON fails, save empty list and continue
            try:
                locked_user.exam_answers = json.dumps(processed, ensure_ascii=False)
            except (TypeError, ValueError) as json_error:
                # If JSON serialization fails, save empty list but still save marks
                locked_user.exam_answers = json.dumps([], ensure_ascii=False)
            
            locked_user.save(update_fields=['exam_attempted', 'exam_marks', 'exam_answers'])
        except Exception as e:
            transaction.set_rollback(True)
            return Response({"detail": "Failed to save results.", "error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        response_payload = {
            "message": "Exam submitted successfully.",
            "marks": total_marks,
            "total_questions_submitted": len(answers),
            "invalid_question_ids": invalid_q_ids,
            "per_question": processed
        }
        return Response(response_payload, status=status.HTTP_200_OK)
