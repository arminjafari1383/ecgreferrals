import React, { useState, useEffect } from "react";
import { useWallet } from "../context/WalletContext";
import "./ReferralPage.css";

const BOT_USERNAME = "pooooooooooobot";
const APP_BASE_URL = "https://cryptoocapitalhub.com";

export default function ReferralPage() {
  const { wallet } = useWallet();
  const [referralData, setReferralData] = useState({
    referralCode: "",
    referralLink: "",
    totalReferrals: 0,
    inviteBonusTotal: "0",
    referralsList: [],
    balanceECG: "0",
    totalRewards: "0",
    totalStaked: "0"
  });
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState({
    totalEarned: "0",
    totalStakedByRefs: "0",
    activeRefs: 0
  });

  const tg = window.Telegram?.WebApp;

  // فراخوانی API برای دریافت اطلاعات رفرال
  useEffect(() => {
    if (wallet) {
      fetchReferralData();
    }
  }, [wallet]);

  const fetchReferralData = async () => {
    try {
      setLoading(true);
      
      // در اینجا می‌توانید API واقعی را فراخوانی کنید
      // برای تست، از داده‌های mock استفاده می‌کنیم
      const mockReferralsData = {
        total_referrals: 5,
        invite_bonus_total: "45.75",
        referrals: [
          {
            purchases_count: 3,
            total_staked: "150.00",
            reward_from_this_user: "7.50",
            joined_at: "2024-01-15T10:30:00Z"
          },
          {
            purchases_count: 1,
            total_staked: "50.00",
            reward_from_this_user: "2.50",
            joined_at: "2024-01-20T14:45:00Z"
          }
        ]
      };

      const mockRewardData = {
        wallet: wallet,
        balance_ecg: "125.50",
        referral_code: "CRYPTO" + wallet.slice(2, 6).toUpperCase() + "ABCD",
        seconds_remaining: 0,
        rewards_count: 25,
        total_rewards: "250.75",
        total_staked: "500.00",
        referral_points: "15"
      };
      
      // شبیه‌سازی تأخیر API
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const referralsData = mockReferralsData;
      const rewardData = mockRewardData;
      
      setReferralData({
        referralCode: rewardData.referral_code || "",
        referralLink: `https://cryptoocapitalhub.com/r/${rewardData.referral_code}/`,
        totalReferrals: referralsData.total_referrals || 0,
        inviteBonusTotal: referralsData.invite_bonus_total || "0",
        referralsList: referralsData.referrals || [],
        balanceECG: rewardData.balance_ecg || "0",
        totalRewards: rewardData.total_rewards || "0",
        totalStaked: rewardData.total_staked || "0"
      });

      // محاسبه آمار پیشرفته با استفاده از داده‌های فعلی
      calculateAdvancedStats(referralsData.referrals || []);
    } catch (error) {
      console.error("Error fetching referral data:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateAdvancedStats = (referrals) => {
    let totalStakedByRefs = 0;
    let activeRefs = 0;
    
    referrals.forEach(ref => {
      totalStakedByRefs += parseFloat(ref.total_staked || 0);
      if (parseFloat(ref.total_staked || 0) > 0) {
        activeRefs++;
      }
    });
    
    // استفاده از inviteBonusTotal از referralData
    setStats({
      totalEarned: referralData.inviteBonusTotal, // حالا این مقدار تعریف شده است
      totalStakedByRefs: totalStakedByRefs.toFixed(2),
      activeRefs
    });
  };

  // ایجاد لینک‌های اشتراک‌گذاری
  const getShareLinks = () => {
    if (!referralData.referralCode) return {
      telegramBot: "",
      web: "",
      direct: "",
      shareMessage: "",
      twitter: "",
      whatsapp: "",
      telegramShare: ""
    };
    
    const telegramBotLink = `https://t.me/${BOT_USERNAME}?start=${referralData.referralCode}`;
    const webLink = `https://cryptoocapitalhub.com/wallets?ref=${referralData.referralCode}`;
    const directLink = `https://cryptoocapitalhub.com/r/${referralData.referralCode}/`;
    
    const shareMessage = `🚀 Join Crypto Capital Hub and earn with me!\n\nUse my referral code: ${referralData.referralCode}\n\nGet 3 ECG bonus when you connect your wallet!\n\n${directLink}`;
    
    return {
      telegramBot: telegramBotLink,
      web: webLink,
      direct: directLink,
      shareMessage,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessage)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(shareMessage)}`,
      telegramShare: `https://t.me/share/url?url=${encodeURIComponent(directLink)}&text=${encodeURIComponent(shareMessage)}`
    };
  };

  const links = getShareLinks();

  // کپی به کلیپ‌بورد
  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      
      // بازخورد بصری در تلگرام
      if (tg?.showAlert) {
        tg.showAlert("✅ Link copied to clipboard!");
      }
    } catch (err) {
      console.error("Failed to copy:", err);
      // روش fallback برای مرورگرهای قدیمی
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // باز کردن تلگرام بات
  const openTelegramBot = () => {
    if (!links.telegramBot) return;
    if (tg?.openLink) {
      tg.openLink(links.telegramBot);
    } else {
      window.open(links.telegramBot, "_blank");
    }
  };

  // اشتراک‌گذاری در پلتفرم‌ها
  const shareOnPlatform = (platform) => {
    const platformLinks = {
      twitter: links.twitter,
      whatsapp: links.whatsapp,
      telegram: links.telegramShare
    };
    
    if (platformLinks[platform]) {
      if (tg?.openLink) {
        tg.openLink(platformLinks[platform]);
      } else {
        window.open(platformLinks[platform], "_blank");
      }
    }
  };

  // بازخوانی داده‌ها
  const refreshData = () => {
    fetchReferralData();
  };

  if (!wallet) {
    return (
      <div className="ref-page">
        <div className="ref-box">
          <h2 className="ref-title">👥 Referral Dashboard</h2>
          <p className="ref-warning">⚠️ Please connect your wallet first.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="ref-page">
      <div className="ref-box">
        <div className="ref-header">
          <h2 className="ref-title">👥 Referral Dashboard</h2>
          <button className="refresh-btn" onClick={refreshData}>
            🔄 Refresh
          </button>
        </div>

        <p className="ref-connected-wallet">
          Connected Wallet: <b>{wallet.slice(0, 6)}...{wallet.slice(-4)}</b>
        </p>

        {/* آمار کلی */}
        <div className="ref-stats">
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-number">{referralData.totalReferrals}</div>
            <div className="stat-label">Total Referrals</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">💰</div>
            <div className="stat-number">{referralData.inviteBonusTotal} ECG</div>
            <div className="stat-label">Earned from Referrals</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">📈</div>
            <div className="stat-number">{stats.activeRefs}</div>
            <div className="stat-label">Active Referrals</div>
          </div>
        </div>

        {/* کد رفرال */}
        {referralData.referralCode && (
          <div className="ref-code-section">
            <h3 className="section-title">🎯 Your Referral Code</h3>
            <div className="code-display">
              <div className="code-value">{referralData.referralCode}</div>
              <button 
                className="copy-btn-icon"
                onClick={() => copyToClipboard(referralData.referralCode)}
                title="Copy referral code"
              >
                {copied ? '✅' : '📋'}
              </button>
            </div>
          </div>
        )}

        {/* لینک‌های اشتراک‌گذاری */}
        <div className="ref-links-section">
          <h3 className="section-title">🔗 Share Your Link</h3>
          
          <div className="link-item">
            <label>Direct Referral Link:</label>
            <div className="input-group">
              <input 
                type="text" 
                value={links.direct || ""} 
                readOnly 
                className="link-input"
              />
              <button 
                className="copy-btn"
                onClick={() => copyToClipboard(links.direct)}
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          <div className="share-platforms">
            <h4>Quick Share:</h4>
            <div className="platform-buttons">
              <button 
                className="platform-btn telegram-btn"
                onClick={openTelegramBot}
              >
                <span className="btn-icon">🤖</span>
                Telegram Bot
              </button>
              
              <button 
                className="platform-btn share-telegram-btn"
                onClick={() => shareOnPlatform('telegram')}
              >
                <span className="btn-icon">📤</span>
                Share on Telegram
              </button>
              
              <button 
                className="platform-btn twitter-btn"
                onClick={() => shareOnPlatform('twitter')}
              >
                <span className="btn-icon">🐦</span>
                Twitter
              </button>
              
              <button 
                className="platform-btn whatsapp-btn"
                onClick={() => shareOnPlatform('whatsapp')}
              >
                <span className="btn-icon">💬</span>
                WhatsApp
              </button>
            </div>
          </div>
        </div>

        {/* لیست رفرال‌ها */}
        {referralData.referralsList.length > 0 && (
          <div className="referrals-list-section">
            <h3 className="section-title">📊 Your Referrals ({referralData.totalReferrals})</h3>
            
            <div className="table-responsive">
              <table className="referrals-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Joined At</th>
                    <th>Purchases</th>
                    <th>Total Staked</th>
                    <th>Your Reward</th>
                  </tr>
                </thead>
                <tbody>
                  {referralData.referralsList.map((ref, index) => (
                    <tr key={index}>
                      <td>{index + 1}</td>
                      <td>{new Date(ref.joined_at).toLocaleDateString()}</td>
                      <td>{ref.purchases_count || 0}</td>
                      <td>{parseFloat(ref.total_staked || 0).toFixed(2)} ECG</td>
                      <td className="reward-cell">
                        +{parseFloat(ref.reward_from_this_user || 0).toFixed(2)} ECG
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="summary-row">
              <div className="summary-item">
                <span className="summary-label">Total Staked by Referrals:</span>
                <span className="summary-value">{stats.totalStakedByRefs} ECG</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Total Earned:</span>
                <span className="summary-value highlight">{referralData.inviteBonusTotal} ECG</span>
              </div>
            </div>
          </div>
        )}

        {/* راهنما */}
        <div className="instructions-section">
          <h3 className="section-title">📋 How It Works</h3>
          <div className="instructions-grid">
            <div className="instruction-card">
              <div className="instruction-icon">1️⃣</div>
              <h4>Share Your Link</h4>
              <p>Share your referral link with friends via Telegram, Twitter, or other platforms</p>
            </div>
            
            <div className="instruction-card">
              <div className="instruction-icon">2️⃣</div>
              <h4>Friends Connect Wallet</h4>
              <p>Friends connect their wallet using your link - they get 3 ECG bonus instantly!</p>
            </div>
            
            <div className="instruction-card">
              <div className="instruction-icon">3️⃣</div>
              <h4>They Make Purchases</h4>
              <p>When friends purchase ECG tokens, you earn 5% of their purchase amount</p>
            </div>
            
            <div className="instruction-card">
              <div className="instruction-icon">4️⃣</div>
              <h4>Earn Rewards</h4>
              <p>Track your earnings in real-time and withdraw anytime</p>
            </div>
          </div>
        </div>

        {/* تبلیغ */}
        <div className="promo-banner">
          <div className="promo-content">
            <h4>🚀 Boost Your Earnings!</h4>
            <p>Invite more friends and earn more ECG tokens. The more active referrals, the higher your passive income!</p>
          </div>
          <div className="promo-actions">
            <button className="promo-btn" onClick={openTelegramBot}>
              🤖 Share Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}