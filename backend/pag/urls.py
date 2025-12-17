from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import WalletViewSet, referral_redirect

router = DefaultRouter()
router.register(r'wallet', WalletViewSet, basename='wallet')

urlpatterns = [
    path('api/', include(router.urls)),
    path('r/<str:code>/', referral_redirect, name='referral_redirect'),
]
