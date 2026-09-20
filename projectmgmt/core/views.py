from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from django.contrib.auth import login
from .models import User, Project
from .serializers import UserSerializer, RegisterSerializer, LoginSerializer, ProjectSerializer

def get_user_data(user):
    """Directly maps database permission flags to 1 or 0"""
    is_super = user.is_superuser
    
    return {
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'role': 'super_admin' if is_super else user.role,
        'is_approved': user.is_approved,
        'is_superuser': is_super,
        'is_staff': user.is_staff,
        'can_create_project': 1 if is_super else (1 if getattr(user, 'can_create_project', 0) in [True, 1, '1'] else 0),
        'can_read_project': 1 if is_super else (1 if getattr(user, 'can_read_project', 1) in [True, 1, '1'] else 0),
        'can_update_project': 1 if is_super else (1 if getattr(user, 'can_update_project', 0) in [True, 1, '1'] else 0),
    }

@api_view(['POST'])
@permission_classes([AllowAny])
def register_view(request):
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response({"message": "Registration successful. Please wait for admin approval."}, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.validated_data
        login(request, user)
        return Response(get_user_data(user), status=status.HTTP_200_OK)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def current_user_view(request):
    user = User.objects.get(pk=request.user.pk)
    return Response(get_user_data(user), status=status.HTTP_200_OK)

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.filter(is_superuser=False, is_staff=False)
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        user = User.objects.get(pk=self.request.user.pk)
        can_create = getattr(user, 'can_create_project', 0)
        if user.is_superuser or can_create in [True, 1, '1']:
            serializer.save(created_by=user)
        else:
            raise PermissionDenied("You do not have permission to create a project.")

    def perform_update(self, serializer):
        user = User.objects.get(pk=self.request.user.pk)
        project = self.get_object()
        can_update = getattr(user, 'can_update_project', 0)
        has_update = user.is_superuser or project.created_by == user or can_update in [True, 1, '1']
        
        if has_update:
            serializer.save()
        else:
            raise PermissionDenied("You do not have permission to edit this project.")

    def perform_destroy(self, instance):
        user = User.objects.get(pk=self.request.user.pk)
        can_update = getattr(user, 'can_update_project', 0)
        has_update = user.is_superuser or instance.created_by == user or can_update in [True, 1, '1']
        
        if has_update:
            instance.delete()
        else:
            raise PermissionDenied("You do not have permission to delete this project.")