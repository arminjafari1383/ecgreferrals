from django.contrib import admin
from .models import (
    UserProfile,
    ReferralLink,
    WalletUser

)




@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = (
        'wallet_address',
        'referral_code',
        'referred_by',
        'balance_ecg',
        'total_staked',
        'total_rewards',
        'created_at',
    )
    search_fields = ('wallet_address', 'referral_code')
    list_filter = ('created_at',)
    readonly_fields = ('created_at', 'updated_at')


@admin.register(ReferralLink)
class ReferralLinkAdmin(admin.ModelAdmin):
    list_display = (
        'code',
        'referrer',
        'is_active',
        'clicks',
        'created_at',
    )
    search_fields = ('code', 'referrer__wallet_address')
    list_filter = ('is_active', 'created_at')
    readonly_fields = ('created_at',)


@admin.register(WalletUser)
class WalletUserAdmin(admin.ModelAdmin):
    list_display = (
        'wallet_address_short',
        'referral_code',
        'token_balance_display',
        'total_earned_display',
        'total_staked_display',
        'referral_count',
        'created_at'
    )
    list_filter = ('created_at', 'wallet_type')
    search_fields = ('wallet_address', 'referral_code')
    readonly_fields = ('referral_code', 'created_at', 'token_balance', 'total_earned', 'total_staked')
    ordering = ('-created_at',)
    list_per_page = 25
    
    fieldsets = (
        ('اطلاعات اصلی', {
            'fields': ('wallet_address', 'wallet_type', 'referral_code')
        }),
        ('موجودی و درآمد', {
            'fields': ('token_balance', 'total_earned', 'total_staked')
        }),
        ('تاریخ‌ها', {
            'fields': ('created_at',)
        }),
    )
    
    def wallet_address_short(self, obj):
        return f"{obj.wallet_address[:10]}..." if len(obj.wallet_address) > 10 else obj.wallet_address
    wallet_address_short.short_description = 'آدرس کیف‌پول'
    
    def token_balance_display(self, obj):
        return f"{obj.token_balance:.4f}"
    token_balance_display.short_description = 'موجودی توکن'
    
    def total_earned_display(self, obj):
        return f"{obj.total_earned:.4f}"
    total_earned_display.short_description = 'کل درآمد'
    
    def total_staked_display(self, obj):
        return f"{obj.total_staked:.4f} ETH"
    total_staked_display.short_description = 'کل استیک شده'
    
    def referral_count(self, obj):
        count = obj.made_referrals.count()
        return f"{count} نفر"
    referral_count.short_description = 'زیرمجموعه'