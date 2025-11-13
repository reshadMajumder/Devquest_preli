from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.core.exceptions import ValidationError
import re
from uuid import uuid4

# Define the required email domain
REQUIRED_EMAIL_DOMAIN = '@diu.edu.bd'

def validate_diu_email(email):
    """Custom validator to check if the email belongs to the required domain."""
    if not email or not email.endswith(REQUIRED_EMAIL_DOMAIN):
        raise ValidationError(
            f"Registration requires an email with the '{REQUIRED_EMAIL_DOMAIN}' domain.",
            code='invalid_email_domain'
        )

class CustomUserManager(BaseUserManager):
    use_in_migrations = True

    # Updated to only require email (contact removed)
    def _create_user(self, email, password=None, **extra_fields):
        # 1. Validate email existence
        if not email:
            raise ValueError("The Email field must be set")
        
        # 2. Normalize and validate email domain
        email = self.normalize_email(email)
        validate_diu_email(email) 
            
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    # Updated to only use email
    def create_user(self, email=None, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", False)
        extra_fields.setdefault("is_superuser", False)
        return self._create_user(email, password, **extra_fields)

    # Updated to only use email
    def create_superuser(self, email=None, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True.")
        
        # Superuser creation relies on _create_user which handles domain validation
        return self._create_user(email, password, **extra_fields)

class User(AbstractBaseUser, PermissionsMixin):
    id = models.BigAutoField(primary_key=True)
   
    email = models.EmailField(
        unique=True, 
        blank=False, 
        null=False,
        validators=[validate_diu_email]
    )

    is_email_verified = models.BooleanField(default=False)
    full_name = models.CharField(max_length=100, blank=False, null=False)
    whatsapp_number = models.CharField(max_length=20, blank=False, null=False)
    student_id = models.CharField(max_length=50, blank=False, null=False)
    otp = models.CharField(max_length=6, blank=True, null=True)
    date_joined = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False) 
    
    
    exam_attempted = models.BooleanField(
        default=False,
        help_text="Indicates whether the user has attempted the preliminary exam."
    )
    exam_marks = models.IntegerField(
        default=0,
    )
    # Using TextField to store JSON data, which works better with Djongo/MongoDB 
    # than native JSONField, but requires manual JSON serialization/deserialization.
    exam_answers = models.TextField(
        blank=True, 
        default='[]', 
        help_text="JSON string of contestant's answers (e.g., [{'q_id': 1, 'ans': 'C'}, ...])."
    )
    

    objects = CustomUserManager()

    USERNAME_FIELD = 'email' 
    REQUIRED_FIELDS = [] 

    def __str__(self):
        return self.email

    class Meta:
        verbose_name = 'User'
        verbose_name_plural = 'Users'
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['is_active', 'is_email_verified']),
            models.Index(fields=['date_joined']),
            models.Index(fields=['exam_attempted', 'exam_marks']), # Added index for exam stats
        ]