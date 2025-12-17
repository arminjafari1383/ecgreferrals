import uuid
from django.db import models
from django.utils import timezone
from decimal import Decimal


# =======================
# Helper
# =======================
def generate_invoice_number():
    """Generate unique invoice number"""
    return uuid.uuid4().hex.upper()[:12]


# =======================
# User Profile
# =======================
class UserProfile(models.Model):
    # ---------- Blockchain Wallet ----------
    wallet_address = models.CharField(
        max_length=120,
        unique=True,
        primary_key=True
    )

    # # ---------- Telegram Info ----------
    # telegram_id = models.BigIntegerField(null=True, blank=True)
    # telegram_username = models.CharField(max_length=120, null=True, blank=True)
    # telegram_firstname = models.CharField(max_length=120, null=True, blank=True)
    # telegram_photo = models.URLField(null=True, blank=True)

    # ---------- Referral System ----------
    referral_code = models.CharField(max_length=20, unique=True, null=True, blank=True)
    referred_by = models.ForeignKey(
        "self",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="referrals"
    )

    # ---------- Activity ----------
    last_connected = models.DateTimeField(null=True, blank=True)
    last_reward_at = models.DateTimeField(null=True, blank=True) # برای ماینینگ روزانه
    rewards_count = models.IntegerField(default=0)
    referral_points = models.IntegerField(default=0) # (این فیلد دیگر استفاده نمی‌شود اما برای سازگاری باقی می‌ماند)

    # ---------- Balances ----------
    # موجودی قابل برداشت (شامل پاداش‌ها، ماینینگ و سود استیک)
    balance_ecg = models.DecimalField(max_digits=36, decimal_places=18, default=Decimal("0"))
    # کل استیک شده (قفل شده)
    total_staked = models.DecimalField(max_digits=36, decimal_places=18, default=Decimal("0"))
    # جمع کل پاداش‌های دریافتی (برای آمار)
    total_rewards = models.DecimalField(max_digits=36, decimal_places=18, default=Decimal("0"))

    # ---------- 0.05 Rewards (اینها برای آمار خوب هستند) ----------
    flat_bonus_self = models.DecimalField(max_digits=36, decimal_places=18, default=Decimal("0"))
    flat_bonus_upline = models.DecimalField(max_digits=36, decimal_places=18, default=Decimal("0"))

    # ---------- Timestamps ----------
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        tg = f" (@{self.telegram_username})" if self.telegram_username else ""
        return f"{self.wallet_address}{tg}"


# =======================
# Transaction (بدون تغییر)
# =======================
class Transaction(models.Model):
    # ... (کد این مدل از فایل اصلی شما بدون تغییر باقی می‌ماند) ...
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


# =======================
# Referral Link (بدون تغییر)
# =======================
class ReferralLink(models.Model):
    # ... (کد این مدل از فایل اصلی شما بدون تغییر باقی می‌ماند) ...
    code = models.CharField(max_length=32, unique=True, db_index=True)
    referrer = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name="referral_links")
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)
    clicks = models.IntegerField(default=0)

    def __str__(self):
        return f"{self.code} → {self.referrer.wallet_address}"


# =======================
# Purchase Invoice (اصلاح شد)
# =======================
class PurchaseInvoice(models.Model):
    invoice_number = models.CharField(max_length=64, unique=True, default=generate_invoice_number)
    user = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name="invoices")
    
    # ❗️ فیلدهای جدید برای پیگیری تراکنش
    transaction_hash = models.CharField(max_length=200, null=True, blank=True)
    network = models.CharField(max_length=20, null=True, blank=True, default="bep20")

    amount_ecg = models.DecimalField(max_digits=36, decimal_places=18, default=Decimal("0"))
    amount_usdt = models.DecimalField(max_digits=36, decimal_places=18, default=Decimal("0"))
    amount_bnb = models.DecimalField(max_digits=36, decimal_places=18, default=Decimal("0"))

    is_paid = models.BooleanField(default=True) # (نشان‌دهنده موفقیت واریز اولیه)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True) # (قفل ۳۶۵ روزه)

    # ❗️ فیلد جدید برای سود ماهانه ۵٪
    last_monthly_reward_at = models.DateTimeField(null=True, blank=True)

    def save(self, *args, **kwargs):
        if not self.expires_at:
            # قفل ۳۶۵ روزه
            self.expires_at = timezone.now() + timezone.timedelta(days=365)
        super().save(*args, **kwargs)

    def days_remaining(self):
        if not self.expires_at: return None
        delta = self.expires_at - timezone.now()
        return max(0, delta.days)

    def __str__(self):
        return f"Invoice {self.invoice_number} - {self.user.wallet_address[:8]}..."


# =======================
# Withdrawal Request (جدید)
# =======================
class WithdrawalRequest(models.Model):
    STATUS_CHOICES = [
        ("PENDING", "Pending"),
        ("COMPLETED", "Completed"),
        ("FAILED", "Failed"),
    ]

    user = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name="withdrawals")
    amount = models.DecimalField(max_digits=36, decimal_places=18)
    
    # آدرس مقصد که کاربر در فرم وارد کرده
    destination_address = models.CharField(max_length=120)
    network = models.CharField(max_length=20, default="bep20")

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="PENDING")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Withdraw {self.amount} ECG for {self.user.wallet_address[:8]}... ({self.status})"