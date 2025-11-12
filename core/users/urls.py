from django.urls import path
from .views import (
    RegisterView, LoginView, VerifyOtpView,
    ForgotPasswordView, ResetPasswordView, ResendOtpView,
    LogoutView, RefreshTokenView
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('verify-otp/', VerifyOtpView.as_view(), name='verify_otp'),
    path('forgot-password/', ForgotPasswordView.as_view(), name='forgot_password'),
    path('reset-password/', ResetPasswordView.as_view(), name='reset_password'),
    path('resend-otp/', ResendOtpView.as_view(), name='resend_otp'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('token/refresh/', RefreshTokenView.as_view(), name='token_refresh'),
]