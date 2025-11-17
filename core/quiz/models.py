from django.db import models

class QuizQuestion(models.Model):
    id = models.BigAutoField(primary_key=True)
    text = models.TextField()
    option_a = models.CharField(max_length=255, blank=True, null=True)
    option_b = models.CharField(max_length=255, blank=True, null=True)
    option_c = models.CharField(max_length=255, blank=True, null=True)
    option_d = models.CharField(max_length=255, blank=True, null=True)

    CORRECT_CHOICES = (
        ('A', 'Option A'),
        ('B', 'Option B'),
        ('C', 'Option C'),
        ('D', 'Option D'),
    )
    correct = models.CharField(max_length=1, choices=CORRECT_CHOICES, blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Q{self.id}"
