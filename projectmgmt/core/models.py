from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    ROLE_CHOICES = [
        ('super_admin', 'Super Admin'),
        ('frontend', 'Front-end Developer'),
        ('backend', 'Back-end Developer'),
        ('fullstack', 'Full Stack Developer'),
    ]
    
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='frontend')
    is_approved = models.BooleanField(default=False)
    can_create_project = models.BooleanField(default=False)
    can_update_project = models.BooleanField(default=False)
    can_read_project = models.BooleanField(default=True)

class Project(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField()
    start_date = models.DateField()
    end_date = models.DateField()
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='projects')
    created_at = models.DateTimeField(auto_now_add=True)
    
    # Stores the selected assigned users directly as a JSON list in the project database row
    assigned_users = models.JSONField(default=list, blank=True)
    
    # Stores the project title and a collection of tasks with description and date
    user_tasks = models.JSONField(default=dict, blank=True)
    
   # ADD this (linking to your User model or storing as a string):
    task_created_by = models.CharField(max_length=150, blank=True, null=True)

    def __str__(self):
        return self.title