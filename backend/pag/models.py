from django.db import models
import secrets
from decimal import Decimal
from django.utils import timezone


# ---------- Wallet User ----------
class WalletUser(models.Model):
    wallet_address = models.CharField(max_length=255, unique=True)
    wallet_type = models.CharField(max_length=20, default='ethereum')
    referral_code = models.CharField(max_length=20, unique=True, blank=True)
    token_balance = models.DecimalField(max_digits=20, decimal_places=8, default=0)
    total_earned = models.DecimalField(max_digits=20, decimal_places=8, default=0)
    total_staked = models.DecimalField(max_digits=20, decimal_places=8, default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.referral_code:
            self.referral_code = self.generate_referral_code()
        super().save(*args, **kwargs)

    def generate_referral_code(self):
        while True:
            code = secrets.token_urlsafe(10)[:10]
            if not WalletUser.objects.filter(referral_code=code).exists():
                return code

    def __str__(self):
        return f"{self.wallet_address[:10]}..." 


# ---------- Referral ----------
class Referral(models.Model):
    referrer = models.ForeignKey(WalletUser, on_delete=models.CASCADE, related_name='made_referrals')
    referee = models.OneToOneField(WalletUser, on_delete=models.CASCADE, related_name='referred_by')
    has_received_signup_bonus = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.referrer.wallet_address[:5]} -> {self.referee.wallet_address[:5]}"


# ---------- Staking ----------
class Staking(models.Model):
    user = models.ForeignKey(WalletUser, on_delete=models.CASCADE, related_name='stakings')
    amount = models.DecimalField(max_digits=20, decimal_places=8)
    bonus_received = models.DecimalField(max_digits=20, decimal_places=8, default=0)
    referrer_bonus = models.DecimalField(max_digits=20, decimal_places=8, default=0)
    staked_at = models.DateTimeField(auto_now_add=True)
    unlock_date = models.DateTimeField(blank=True, null=True)
    is_unlocked = models.BooleanField(default=False)
    unlocked_at = models.DateTimeField(null=True, blank=True)
    tx_hash = models.CharField(max_length=100, blank=True)

    class Meta:
        ordering = ['-staked_at']

    def save(self, *args, **kwargs):
        if not self.unlock_date:
            self.unlock_date = timezone.now() + timezone.timedelta(days=365)
        super().save(*args, **kwargs)

    def days_remaining(self):
        if self.is_unlocked:
            return 0
        remaining = self.unlock_date - timezone.now()
        return max(remaining.days, 0)

    def can_unlock(self):
        return not self.is_unlocked and timezone.now() >= self.unlock_date

    def __str__(self):
        return f"{self.user.wallet_address[:10]} - {self.amount} ETH ({self.days_remaining()} روز)"


# ---------- Token Reward ----------
class TokenReward(models.Model):
    user = models.ForeignKey(WalletUser, on_delete=models.CASCADE, related_name='token_rewards')
    amount = models.DecimalField(max_digits=20, decimal_places=8)
    reward_type = models.CharField(
        max_length=50,
        choices=[
            ('signup_referral', 'پاداش ثبت نام زیرمجموعه'),
            ('staking_self', 'پاداش استیکینگ خود کاربر'),
            ('staking_referral', 'پاداش استیکینگ زیر مجموعه'),
            ('staking_unlock', 'برداشت از استیکینگ'),
        ]
    )
    related_staking = models.ForeignKey(Staking, on_delete=models.SET_NULL, null=True, blank=True)
    related_referral = models.ForeignKey(Referral, on_delete=models.SET_NULL, null=True, blank=True)
    is_paid = models.BooleanField(default=False)
    paid_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.wallet_address[:10]} - {self.amount} ({self.reward_type})"


# ---------- User Profile ----------
class UserProfile(models.Model):
    wallet_address = models.CharField(max_length=120, unique=True, primary_key=True)
    referral_code = models.CharField(max_length=20, unique=True, null=True, blank=True)
    referred_by = models.ForeignKey(
        "self",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="referrals"
    )

    last_connected = models.DateTimeField(null=True, blank=True)
    last_reward_at = models.DateTimeField(null=True, blank=True)
    rewards_count = models.IntegerField(default=0)
    referral_points = models.IntegerField(default=0)

    balance_ecg = models.DecimalField(max_digits=36, decimal_places=18, default=Decimal("0"))
    total_staked = models.DecimalField(max_digits=36, decimal_places=18, default=Decimal("0"))
    total_rewards = models.DecimalField(max_digits=36, decimal_places=18, default=Decimal("0"))

    flat_bonus_self = models.DecimalField(max_digits=36, decimal_places=18, default=Decimal("0"))
    flat_bonus_upline = models.DecimalField(max_digits=36, decimal_places=18, default=Decimal("0"))

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


# ---------- Referral Link ----------
class ReferralLink(models.Model):
    code = models.CharField(max_length=32, unique=True, db_index=True)
    referrer = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name="referral_links")
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)
    clicks = models.IntegerField(default=0)

    def __str__(self):
        return f"{self.code} → {self.referrer.wallet_address}"


# ---------- Transaction ----------
class Transaction(models.Model):
    TRANSACTION_TYPES = [
        ("STAKE", "Stake"),
        ("REWARD", "Reward"),
        ("PURCHASE", "Purchase"),
    ]
    user = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name="transactions")
    transaction_hash = models.CharField(max_length=200, unique=True)
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPES)
    amount_ecg = models.DecimalField(max_digits=20, decimal_places=8, default=Decimal("0"))
    amount_usdt = models.DecimalField(max_digits=20, decimal_places=8, default=Decimal("0"))
    amount_bnb = models.DecimalField(max_digits=20, decimal_places=8, default=Decimal("0"))
    recipient_address = models.CharField(max_length=200)
    status = models.CharField(max_length=20, default="CONFIRMED")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.transaction_type} - {self.user.wallet_address[:8]}..."
