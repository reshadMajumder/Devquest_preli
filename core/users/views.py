from django.shortcuts import render
from django.contrib.auth import authenticate # Added this import
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from .serializers import RegisterSerializer, UserDetailSerializer
from .models import User
from .emails import send_otp_via_email, send_otp_via_email_forgot_password
from rest_framework_simplejwt.tokens import RefreshToken, AccessToken
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework.permissions import IsAuthenticated


class UserDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        serializer = UserDetailSerializer(request.user)
        return Response(serializer.data)


class RegisterView(APIView):
    """
    API endpoint for user registration.
    for now register user but keep the email unverified
    send otp to email for verification
    After verification, set is_email_verified to True

    """
    permission_classes = [permissions.AllowAny]    

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            send_otp_via_email(user.email)
            return Response({"message": f"otp sent to {user.email}"}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class VerifyOtpView(APIView):

    """
    API endpoint to verify OTP for email verification.
    if verified send success response and jwt token access and refresh
    if not verified send error response
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email')
        otp = request.data.get('otp')

        if not email or not otp:
            return Response({"error": "Email and OTP are required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email=email)
            if user.otp == otp:
                user.is_email_verified = True
                user.otp = None  # Clear OTP after successful verification
                user.save()

                refresh = RefreshToken.for_user(user)
                access = refresh.access_token
                return Response({
                    "message": "Email verified successfully.",
                    "refresh": str(refresh),
                    "access": str(access)
                }, status=status.HTTP_200_OK)
            else:
                return Response({"error": "Invalid OTP."}, status=status.HTTP_400_BAD_REQUEST)
        except User.DoesNotExist:
            return Response({"error": "User with this email does not exist."}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        

class LoginView(APIView):
    """
    API endpoint for user login.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')

        if not email or not password:
            return Response({"error": "Email and password are required."}, status=status.HTTP_400_BAD_REQUEST)

        user = authenticate(request=request, email=email, password=password)

        if user is not None:
            refresh = RefreshToken.for_user(user)
            access = refresh.access_token
            return Response({
                "message": "Login successful.",
                "refresh": str(refresh),
                "access": str(access)
            }, status=status.HTTP_200_OK)
        else:
            return Response({"error": "Invalid credentials."}, status=status.HTTP_401_UNAUTHORIZED)

class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data["refresh_token"]
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({"message": "Logout successful."}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class ForgotPasswordView(APIView):
    """
    API endpoint to request a password reset OTP.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response({"error": "Email is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email=email)
            send_otp_via_email_forgot_password(user.email)
            return Response({"message": f"OTP sent to {user.email} for password reset."}, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({"error": "User with this email does not exist."}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ResetPasswordView(APIView):
    """
    API endpoint to reset password with OTP.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email')
        otp = request.data.get('otp')
        password = request.data.get('password') # This should be new_password

        if not email or not otp or not password:
            return Response({"error": "Email, OTP, and new password are required."}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Basic password validation (Django's built-in validators can be used here if needed)
            from django.contrib.auth.password_validation import validate_password
            validate_password(password)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email=email)
            if user.otp == otp:
                user.set_password(password)
                user.otp = None  # Clear OTP after successful reset
                user.save()
                return Response({"message": "Password reset successfully."}, status=status.HTTP_200_OK)
            else:
                return Response({"error": "Invalid OTP."}, status=status.HTTP_400_BAD_REQUEST)
        except User.DoesNotExist:
            return Response({"error": "User with this email does not exist."}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ResendOtpView(APIView):
    """
    API endpoint to resend OTP for email verification.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response({"error": "Email is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email=email)
            if user.is_email_verified:
                return Response({"error": "Email is already verified."}, status=status.HTTP_400_BAD_REQUEST)
            
            send_otp_via_email(user.email)
            return Response({"message": f"OTP resent to {user.email}"}, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({"error": "User with this email does not exist."}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class RefreshTokenView(TokenRefreshView):
    """
    API endpoint to refresh JWT token.
    """
    pass
