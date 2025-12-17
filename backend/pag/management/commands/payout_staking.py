from django.core.management.base import BaseCommand
from django.utils import timezone
from django.db import transaction, models
from pag.models import PurchaseInvoice, UserProfile
from decimal import Decimal

class Command(BaseCommand):
    help = 'Distributes 5% monthly staking rewards for active invoices.'

    def handle(self, *args, **options):
        self.stdout.write(f"[{timezone.now()}] cron: Starting monthly staking payout...")
        
        # ۵٪ سود ماهانه
        MONTHLY_REWARD_RATE = Decimal("0.05")
        
        # فاکتورهایی که زمان پرداخت سود ماهانه‌شان فرا رسیده
        # (یعنی ۳۰ روز از آخرین پرداخت گذشته و هنوز منقضی نشده‌اند)
        now = timezone.now()
        thirty_days_ago = now - timezone.timedelta(days=30)
        
        # فاکتورهای واجد شرایط
        invoices_to_pay = PurchaseInvoice.objects.filter(
            is_paid=True,
            expires_at__gt=now, # هنوز منقضی نشده
            last_monthly_reward_at__lte=thirty_days_ago # ۳۰ روز از آخرین پرداخت گذشته
        )

        if not invoices_to_pay.exists():
            self.stdout.write("cron: No invoices eligible for payout.")
            return

        paid_count = 0
        total_payout = Decimal("0")

        with transaction.atomic():
            for invoice in invoices_to_pay:
                try:
                    user = invoice.user
                    
                    # محاسبه سود ۵٪
                    reward_amount = invoice.amount_ecg * MONTHLY_REWARD_RATE
                    
                    # افزودن به موجودی قابل برداشت کاربر
                    user.balance_ecg += reward_amount
                    user.total_rewards += reward_amount
                    user.save(update_fields=["balance_ecg", "total_rewards"])
                    
                    # آپدیت زمان آخرین پرداخت برای این فاکتور
                    invoice.last_monthly_reward_at = now
                    invoice.save(update_fields=["last_monthly_reward_at"])

                    paid_count += 1
                    total_payout += reward_amount
                    
                except UserProfile.DoesNotExist:
                    self.stderr.write(f"User not found for invoice {invoice.id}. Skipping.")
                except Exception as e:
                    self.stderr.write(f"Error processing invoice {invoice.id}: {e}")

        self.stdout.write(
            f"[{timezone.now()}] cron: SUCCESS! Paid {total_payout:.4f} ECG to {paid_count} users."
        )