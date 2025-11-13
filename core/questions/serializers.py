import json
from rest_framework import serializers
from .models import Question
import random

class QuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Question
        fields = '__all__' 

    def validate_options(self, value):
        try:
            options_list = json.loads(value)
            if not isinstance(options_list, list):
                raise serializers.ValidationError("Options must be a JSON list.")
            for item in options_list:
                if not isinstance(item, str):
                    raise serializers.ValidationError("All options in the list must be strings.")
            return options_list
        except json.JSONDecodeError:
            raise serializers.ValidationError("Enter a valid JSON list for options.")
class ExamineeQuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Question
        fields = ('id', 'text', 'options') # Excludes correct_answer_index

class ReportQuestionSerializer(serializers.ModelSerializer):
    question = serializers.CharField(source='text')
    correctAnswer = serializers.IntegerField(source='correct_answer_index')

    class Meta:
        model = Question
        fields = ('id', 'question', 'options', 'correctAnswer')