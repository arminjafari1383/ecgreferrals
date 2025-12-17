from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from decimal import Decimal
from django.db import transaction, models
from django.shortcuts import redirect, get_object_or_404
import secrets, string

from .models import UserProfile, ReferralLink, PurchaseInvoice, WithdrawalRequest
from .serializers import UserProfileSerializer


# ======================================================
# REFERRAL REDIRECT
# ======================================================
def referral_redirect(request, code):
    link = get_object_or_404(ReferralLink, code=code, is_active=True)
    link.clicks += 1
    link.save(update_fields=["clicks"])
    return redirect(f"https://cryptoocapitalhub.com/wallets?ref={code}")


# ======================================================
# WALLET VIEWSET
# ======================================================
class WalletViewSet(viewsets.ViewSet):

    # --------------------------------------------------
    # CONNECT WALLET  (Fully Fixed)
    # --------------------------------------------------
    @action(detail=False, methods=["post"])
    def connect(self, request):
        wallet = (request.data.get("wallet_address") or "").strip()
        refcode = (request.data.get("referral_code") or "").strip()
        network = (request.data.get("network") or "ton").lower()

        # Clean referral code
        if refcode == "" or len(refcode) < 3:
            refcode = None

        if not wallet:
            return Response({"detail": "wallet_address required"}, status=400)

        print("🔵 CONNECT REQUEST:", wallet, "REF:", refcode, "NETWORK:", network)

        try:
            with transaction.atomic():
                user, created = UserProfile.objects.get_or_create(wallet_address=wallet)

                # Create referral code if not exist
                if not user.referral_code:
                    alphabet = string.ascii_uppercase + string.digits
                    user.referral_code = "".join(secrets.choice(alphabet) for _ in range(10))
                    user.save(update_fields=["referral_code"])

                # Ensure referral link exists
                ReferralLink.objects.get_or_create(
                    referrer=user,
                    defaults={"code": user.referral_code, "is_active": True},
                )

                # ------------------------------
                # REFERRAL PROCESS
                # ------------------------------
                if refcode:
                    ref = UserProfile.objects.filter(referral_code__iexact=refcode).first()

                    # If code belongs to ReferralLink
                    if not ref:
                        ref_link_obj = ReferralLink.objects.filter(code__iexact=refcode, is_active=True).first()
                        if ref_link_obj:
                            ref = ref_link_obj.referrer
                            ref_link_obj.clicks += 1
                            ref_link_obj.save(update_fields=["clicks"])

                    # Ensure valid ref
                    if ref and ref.wallet_address.lower() != wallet.lower():

                        # Give +3 ECG reward to ref ONLY IF user is new
                        if created:
                            ref.balance_ecg += Decimal("3")
                            ref.total_rewards += Decimal("3")
                            ref.save(update_fields=["balance_ecg", "total_rewards"])

                        user.referred_by = ref
                        user.save(update_fields=["referred_by"])

                # Update last-connected time
                user.last_connected = timezone.now()
                user.save(update_fields=["last_connected"])

                # Return referral link
                referral_link = f"https://cryptoocapitalhub.com/r/{user.referral_code}/"

                return Response({
                    "status": "ok",
                    "message": "Wallet connected successfully" if created else "Wallet reconnected",
                    "referral_link": referral_link,
                    "user": UserProfileSerializer(user).data,
                })

        except Exception as e:
            print("❌ CONNECT ERROR:", e)
            return Response({"detail": str(e)}, status=500)

    # --------------------------------------------------
    # PURCHASE
    # --------------------------------------------------
    @action(detail=False, methods=["post"])
    def purchase(self, request):
        wallet = request.data.get("wallet", "").strip()
        if not wallet:
            return Response({"detail": "wallet required"}, status=400)

        user = UserProfile.objects.filter(wallet_address__iexact=wallet).first()
        if not user:
            return Response({"detail": "user not found"}, status=404)

        amount_usdt = Decimal(str(request.data.get("amount_usdt", "0")))
        tx_hash = request.data.get("transaction_hash", "")
        network = request.data.get("network", "bep20")

        ECG_PRICE_IN_USDT = Decimal("0.01111")
        if amount_usdt <= 0:
            return Response({"detail": "amount_usdt must be positive"}, status=400)

        amount_ecg = amount_usdt / ECG_PRICE_IN_USDT
        UPLINE_RATE = Decimal("0.05")

        with transaction.atomic():
            invoice = PurchaseInvoice.objects.create(
                user=user,
                amount_ecg=amount_ecg,
                amount_usdt=amount_usdt,
                transaction_hash=tx_hash,
                network=network,
                is_paid=True,
                last_monthly_reward_at=timezone.now()
            )

            user.total_staked += amount_ecg
            user.save(update_fields=["total_staked"])

            upline_wallet = None
            upline_bonus = Decimal("0")

            if user.referred_by:
                ref = user.referred_by
                if ref and ref.wallet_address:
                    upline_bonus = amount_ecg * UPLINE_RATE
                    ref.balance_ecg += upline_bonus
                    ref.total_rewards += upline_bonus
                    ref.flat_bonus_upline += upline_bonus
                    ref.save(update_fields=["balance_ecg", "total_rewards", "flat_bonus_upline"])
                    upline_wallet = ref.wallet_address

        return Response({
            "status": "ok",
            "message": "Purchase successful and tokens staked.",
            "received_ecg": str(amount_ecg),
            "upline_reward_paid": str(upline_bonus),
            "upline_wallet": upline_wallet,
            "invoice": {
                "invoice_number": invoice.invoice_number,
                "amount_ecg": str(invoice.amount_ecg),
                "days_remaining": invoice.days_remaining(),
            }
        })

    # --------------------------------------------------
    # REFERRALS
    # --------------------------------------------------
    @action(detail=False, methods=["get"])
    def referrals(self, request):
        wallet = request.query_params.get("wallet", "").strip()
        if not wallet:
            return Response({"detail": "wallet parameter required"}, status=400)

        user = UserProfile.objects.filter(wallet_address__iexact=wallet).first()
        if not user:
            return Response({"detail": "user not found"}, status=404)

        subs = UserProfile.objects.filter(referred_by=user)
        total_invite_bonus = subs.aggregate(total=models.Sum('flat_bonus_upline'))['total'] or Decimal("0")

        referrals_list = []
        for s in subs:
            referrals_list.append({
                "purchases_count": s.invoices.count(),
                "total_staked": str(s.total_staked),
                "reward_from_this_user": str(s.flat_bonus_upline),
                "joined_at": s.created_at,
            })

        return Response({
            "status": "ok",
            "total_referrals": subs.count(),
            "invite_bonus_total": str(total_invite_bonus),
            "referrals": referrals_list,
        })

    # --------------------------------------------------
    # REWARD STATUS
    # --------------------------------------------------
    @action(detail=False, methods=["get"])
    def reward_status(self, request):
        wallet = request.query_params.get("wallet", "")
        user = UserProfile.objects.filter(wallet_address__iexact=wallet).first()

        if not user:
            return Response({"detail": "user not found"}, status=404)

        remaining = 0
        if user.last_reward_at:
            next_time = user.last_reward_at + timezone.timedelta(hours=24)
            remaining = max(0, int((next_time - timezone.now()).total_seconds()))

        return Response({
            "status": "ok",
            "wallet": user.wallet_address,
            "balance_ecg": str(user.balance_ecg),
            "referral_code": user.referral_code,
            "seconds_remaining": remaining,
            "rewards_count": user.rewards_count,
            "total_rewards": str(user.total_rewards),
            "total_staked": str(user.total_staked),
            "referral_points": str(user.referrals.count() * 3),
        })

    # --------------------------------------------------
    # TICK (Daily Mining)
    # --------------------------------------------------
    @action(detail=False, methods=["post"])
    def tick(self, request):
        wallet = request.data.get("wallet_address", "").strip()
        user = UserProfile.objects.filter(wallet_address__iexact=wallet).first()

        if not user:
            return Response({"detail": "user not found"}, status=404)

        if user.last_reward_at:
            if timezone.now() < user.last_reward_at + timezone.timedelta(hours=24):
                return Response({"status": "error", "message": "Please wait 24 hours."}, status=400)

        REWARD = Decimal("1")

        with transaction.atomic():
            user.balance_ecg += REWARD
            user.total_rewards += REWARD
            user.rewards_count += 1
            user.last_reward_at = timezone.now()
            user.save()

        return Response({
            "status": "rewarded",
            "message": f"+{REWARD} ECG added.",
            "balance_ecg": str(user.balance_ecg),
            "rewards_count": user.rewards_count,
            "total_rewards": str(user.total_rewards),
        })

    # --------------------------------------------------
    # REQUEST WITHDRAW
    # --------------------------------------------------
    @action(detail=False, methods=["post"])
    def request_withdraw(self, request):
        wallet = request.data.get("wallet_address", "").strip()
        amount_str = request.data.get("amount", "0")
        to_address = request.data.get("to_address", "").strip()
        network = request.data.get("network", "bep20")

        user = UserProfile.objects.filter(wallet_address__iexact=wallet).first()
        if not user:
            return Response({"detail": "user not found"}, status=404)

        if not to_address:
            return Response({"detail": "Destination address is required."}, status=400)

        try:
            amount = Decimal(amount_str)
        except:
            return Response({"detail": "Invalid amount format."}, status=400)

        MIN = Decimal("60")
        if amount < MIN:
            return Response({"status": "error", "message": f"Minimum withdrawal is {MIN} ECG."}, status=400)

        with transaction.atomic():
            user = UserProfile.objects.select_for_update().get(pk=user.pk)

            if user.balance_ecg < amount:
                return Response({"status": "error", "message": "Insufficient balance."}, status=400)

            user.balance_ecg -= amount
            user.save(update_fields=["balance_ecg"])

            WithdrawalRequest.objects.create(
                user=user,
                amount=amount,
                destination_address=to_address,
                network=network,
                status="PENDING"
            )

        return Response({
            "status": "ok",
            "message": "Withdrawal request submitted.",
            "new_balance_ecg": str(user.balance_ecg)
        })
