from django.urls import path, include
from rest_framework.routers import DefaultRouter
from core.views import register_view, login_view, current_user_view, UserViewSet, ProjectViewSet

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')
router.register(r'projects', ProjectViewSet, basename='project')

urlpatterns = [
    path('', include(router.urls)),
    path('register/', register_view, name='register'),
    path('login/', login_view, name='login'),
    path('auth/current-user/', current_user_view, name='current-user'),
]