# quiz/serializers.py
import json
from rest_framework import serializers
from .models import QuizQuestion

class QuestionSerializer(serializers.ModelSerializer):
    """
    Serializer that does NOT expose the 'correct' field.
    """
    class Meta:
        model = QuizQuestion
        fields = ['id', 'text', 'option_a', 'option_b', 'option_c', 'option_d']

class AnswerItemSerializer(serializers.Serializer):
    q_id = serializers.IntegerField()
    ans = serializers.CharField(max_length=1)

    def validate_ans(self, value):
        val = value.strip().upper()
        if val not in ('A', 'B', 'C', 'D'):
            raise serializers.ValidationError("Answer must be one of A, B, C, D.")
        return val

class SubmitAnswersSerializer(serializers.Serializer):
    answers = serializers.ListSerializer(
        child=AnswerItemSerializer()
    )

    def validate_answers(self, value):
        # optional: check duplicates q_id
        q_ids = [item['q_id'] for item in value]
        if len(q_ids) != len(set(q_ids)):
            raise serializers.ValidationError("Duplicate question ids in payload.")
        return value
