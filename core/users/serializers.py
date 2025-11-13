from .models import User
from rest_framework import serializers


from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['full_name'] = user.full_name
        return token

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('email', 'password', 'full_name', 'whatsapp_number', 'student_id', 'exam_attempted', 'exam_marks')

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)

class UserDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'email', 'full_name', 'whatsapp_number', 'student_id', 'exam_attempted', 'exam_answers', 'exam_marks')
