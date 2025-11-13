from django.db import models

class Question(models.Model):
    text = models.TextField(unique=True)
    options = models.JSONField() # Stores a list of strings, e.g., ["Option A", "Option B", "Option C"]
    correct_answer_index = models.IntegerField() # 0-indexed position of the correct answer in the options list
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.text[:50] # Display first 50 characters of the question text

    class Meta:
        verbose_name = "Question"
        verbose_name_plural = "Questions"
        ordering = ['-created_at']