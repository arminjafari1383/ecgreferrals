from rest_framework import status, viewsets
from rest_framework.decorators import action, api_view
from rest_framework.response import Response
from django.shortcuts import get_object_or_404, redirect
from decimal import Decimal
from django.db import transaction, models
from .models import WalletUser, Referral, TokenReward, ReferralLink

import secrets, string


# --------------------------------------------------
# REFERRAL REDIRECT
# --------------------------------------------------
def referral_redirect(request, code):
    link = get_object_or_404(ReferralLink, code=code, is_active=True)
    link.clicks += 1
    link.save(update_fields=["clicks"])
    return redirect(f"https://cryptoocapitalhub.com/wallets?ref={code}")


# --------------------------------------------------
# WALLET VIEWSET
# --------------------------------------------------
class WalletViewSet(viewsets.ViewSet):

    @action(detail=False, methods=["post"])
    def connect(self, request):
        wallet_address = (request.data.get("wallet_address") or "").strip()
        referral_code = request.data.get('referral_code')
        network = (request.data.get("network") or "ton").lower()

        if not wallet_address:
            return Response({"detail": "wallet_address required"}, status=400)

        with transaction.atomic():
            user, created = WalletUser.objects.get_or_create(wallet_address=wallet_address)

            response_data = {
                'wallet_address': user.wallet_address,
                'referral_code': user.referral_code,
                'is_new': created,
                'token_balance': float(user.token_balance),
                'total_earned': float(user.total_earned),
                'total_staked': float(user.total_staked)
            }

            if created and referral_code:
                try:
                    referrer = WalletUser.objects.get(referral_code=referral_code)
                    referral = Referral.objects.create(referrer=referrer, referee=user)
                    
                    # افزودن جایزه به رفرر
                    referrer.token_balance += Decimal('3')
                    referrer.total_earned += Decimal('3')
                    referrer.save(update_fields=['token_balance','total_earned'])

                    referral.has_received_signup_bonus = True
                    referral.save(update_fields=['has_received_signup_bonus'])

                    TokenReward.objects.create(
                        user=referrer,
                        amount=Decimal('3'),
                        reward_type='signup_referral',
                        related_referral=referral
                    )

                    response_data['referrer_bonus_given'] = True
                    response_data['referrer_received'] = 3

                except WalletUser.DoesNotExist:
                    response_data['referrer_bonus_given'] = False

        return Response(response_data)


# --------------------------------------------------
# GET USER STATS
# --------------------------------------------------
@api_view(['GET'])
def get_user_stats(request, wallet_address):
    try:
        user = WalletUser.objects.get(wallet_address=wallet_address)
    except WalletUser.DoesNotExist:
        return Response({'error':'User not found'}, status=404)

    referrals_count = Referral.objects.filter(referrer=user).count()

    signup_rewards = TokenReward.objects.filter(
        user=user,
        reward_type='signup_referral'
    ).aggregate(total=models.Sum('amount'))['total'] or Decimal('0')

    staking_self_rewards = TokenReward.objects.filter(
        user=user,
        reward_type='staking_self'
    ).aggregate(total=models.Sum('amount'))['total'] or Decimal('0')

    staking_referral_rewards = TokenReward.objects.filter(
        user=user,
        reward_type='staking_referral'
    ).aggregate(total=models.Sum('amount'))['total'] or Decimal('0')

    total_earned_from_staking = staking_self_rewards + staking_referral_rewards

    return Response({
        'referral_code': user.referral_code,
        'referral_link': f"http://localhost:3000?ref={user.referral_code}",
        'total_referrals': referrals_count,
        'token_balance': float(user.token_balance),
        'total_earned': float(user.total_earned),
        'total_staked': float(user.total_staked),
        'earned_from_staking': float(total_earned_from_staking),
        'reward_breakdown': {
            'from_signups': float(signup_rewards),
            'from_own_staking': float(staking_self_rewards),
            'from_referral_staking': float(staking_referral_rewards)
        }
    })
