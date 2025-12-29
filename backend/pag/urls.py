# backend/referral/urls.py
from django.urls import path,include
from rest_framework.routers import DefaultRouter
from . import views
from .views import *

router = DefaultRouter()
router.register(r'wallet', WalletViewSet, basename='wallet')

urlpatterns = [
    path('api/', include(router.urls)),
    path('r/<str:code>/', referral_redirect, name='referral_redirect'),
]