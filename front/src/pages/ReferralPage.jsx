import React, { useState, useEffect } from "react";
import { useWallet } from "../context/WalletContext";
import "./ReferralPage.css";

const BOT_USERNAME = "pooooooooooobot";
const APP_BASE_URL = "https://cryptoocapitalhub.com";

export default function ReferralPage() {
  const { wallet } = useWallet();
  const [referralCode, setReferralCode] = useState("");
  const [myLinkTelegram, setMyLinkTelegram] = useState("");
  const [myLinkBrowser, setMyLinkBrowser] = useState("");
  const [referralCount, setReferralCount] = useState(0);
  const [copied, setCopied] = useState(false);

  const tg = window.Telegram?.WebApp;

  // ایجاد یا بازیابی کد رفرال
  useEffect(() => {
    if (wallet) {
      let code = localStorage.getItem(`ref_code_${wallet}`);
      
      if (!code) {
        // ایجاد کد رفرال منحصربه‌فرد
        const prefix = "CRYPTO";
        const timestamp = Date.now().toString(36);
        const walletPart = wallet.slice(2, 6).toUpperCase();
        code = `${prefix}${walletPart}${timestamp.slice(-4)}`;
        localStorage.setItem(`ref_code_${wallet}`, code);
        
        // ذخیره اطلاعات رفرال در localStorage
        const referralData = {
          code: code,
          wallet: wallet,
          date: new Date().toISOString(),
          referrals: []
        };
        localStorage.setItem(`ref_data_${code}`, JSON.stringify(referralData));
      }
      
      setReferralCode(code);
      
      // بررسی رفرال‌های قبلی
      const refData = JSON.parse(localStorage.getItem(`ref_data_${code}`) || '{"referrals": []}');
      setReferralCount(refData.referrals.length);
    }
  }, [wallet]);

  // ایجاد لینک‌ها
  useEffect(() => {
    if (referralCode) {
      setMyLinkTelegram(`https://t.me/${BOT_USERNAME}?start=${referralCode}`);
      setMyLinkBrowser(`${APP_BASE_URL}/?ref=${referralCode}`);
    }
  }, [referralCode]);

  // ثبت رفرال جدید (این تابع باید در صفحه اصلی یا والت اتصال فراخوانی شود)
  const registerReferral = (referrerCode, newUserWallet) => {
    if (!referrerCode || !newUserWallet) return false;
    
    try {
      const refData = JSON.parse(localStorage.getItem(`ref_data_${referrerCode}`) || '{"referrals": []}');
      
      // جلوگیری از ثبت تکراری
      if (!refData.referrals.some(ref => ref.wallet === newUserWallet)) {
        const newReferral = {
          wallet: newUserWallet,
          date: new Date().toISOString(),
          timestamp: Date.now()
        };
        
        refData.referrals.push(newReferral);
        localStorage.setItem(`ref_data_${referrerCode}`, JSON.stringify(refData));
        
        // آپدیت تعداد رفرال‌ها در state
        setReferralCount(refData.referrals.length);
        return true;
      }
    } catch (error) {
      console.error("Error registering referral:", error);
    }
    return false;
  };

  // کپی لینک به کلیپ‌بورد
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // باز کردن تلگرام با متن از پیش تعریف شده
  const shareOnTelegram = () => {
    const message = `💰 Join Crypto Capital Hub with my referral link!\n\nUse this link to register and earn rewards:\n${myLinkTelegram}\n\nLet's build wealth together! 🚀`;
    
    const tgShareLink = `https://t.me/share/url?url=${encodeURIComponent(myLinkTelegram)}&text=${encodeURIComponent(message)}`;
    
    if (tg?.openLink) {
      tg.openLink(tgShareLink);
    } else {
      window.open(tgShareLink, '_blank');
    }
  };

  // اشتراک‌گذاری در سایر پلتفرم‌ها
  const shareOnPlatform = (platform) => {
    const message = `Join Crypto Capital Hub with my referral link: ${myLinkBrowser}`;
    
    const platforms = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(message)}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(myLinkBrowser)}&text=${encodeURIComponent(message)}`
    };
    
    if (platforms[platform]) {
      if (tg?.openLink) {
        tg.openLink(platforms[platform]);
      } else {
        window.open(platforms[platform], '_blank');
      }
    }
  };

  // باز کردن ربات تلگرام
  const openTelegramBot = () => {
    if (!myLinkTelegram) return;
    if (tg?.openLink) {
      tg.openLink(myLinkTelegram);
    } else {
      window.open(myLinkTelegram, "_blank");
    }
  };

  // تابع برای گرفتن لینک رفرال از URL (در صفحه اصلی استفاده شود)
  const getRefFromUrl = () => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('ref');
  };

  return (
    <div className="ref-page">
      <div className="ref-box">
        <h2 className="ref-title">👥 Referral Dashboard</h2>

        {!wallet ? (
          <p className="ref-warning">⚠️ Please connect your wallet first.</p>
        ) : (
          <>
            <div className="ref-stats">
              <div className="stat-card">
                <div className="stat-number">{referralCount}</div>
                <div className="stat-label">Total Referrals</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">${referralCount * 5}</div>
                <div className="stat-label">Estimated Rewards</div>
              </div>
            </div>

            <p className="ref-connected-wallet">
              Connected Wallet: <b>{wallet.slice(0, 6)}...{wallet.slice(-4)}</b>
            </p>

            {referralCode && (
              <div className="ref-code-display">
                <h3>Your Referral Code:</h3>
                <div className="ref-code">
                  <code>{referralCode}</code>
                  <button 
                    className="copy-btn"
                    onClick={() => copyToClipboard(referralCode)}
                  >
                    {copied ? '✅ Copied!' : '📋 Copy Code'}
                  </button>
                </div>
              </div>
            )}

            {myLinkTelegram && myLinkBrowser && (
              <div className="ref-link-box">
                <h3 className="ref-link-title">🔗 Your Referral Links</h3>
                
                <div className="ref-link-section">
                  <label>Telegram Bot Link:</label>
                  <div className="link-input-group">
                    <input 
                      type="text" 
                      value={myLinkTelegram} 
                      readOnly 
                      className="link-input"
                    />
                    <button 
                      className="copy-btn"
                      onClick={() => copyToClipboard(myLinkTelegram)}
                    >
                      {copied ? '✅' : '📋'}
                    </button>
                  </div>
                </div>

                <div className="ref-link-section">
                  <label>Browser Link:</label>
                  <div className="link-input-group">
                    <input 
                      type="text" 
                      value={myLinkBrowser} 
                      readOnly 
                      className="link-input"
                    />
                    <button 
                      className="copy-btn"
                      onClick={() => copyToClipboard(myLinkBrowser)}
                    >
                      {copied ? '✅' : '📋'}
                    </button>
                  </div>
                </div>

                <div className="share-buttons">
                  <h4>Share with Friends:</h4>
                  <div className="button-group">
                    <button 
                      className="share-btn telegram-btn"
                      onClick={openTelegramBot}
                    >
                      🤖 Open Telegram Bot
                    </button>
                    
                    <button 
                      className="share-btn share-telegram-btn"
                      onClick={shareOnTelegram}
                    >
                      📤 Share on Telegram
                    </button>
                    
                    <button 
                      className="share-btn twitter-btn"
                      onClick={() => shareOnPlatform('twitter')}
                    >
                      🐦 Share on Twitter
                    </button>
                    
                    <button 
                      className="share-btn whatsapp-btn"
                      onClick={() => shareOnPlatform('whatsapp')}
                    >
                      💬 Share on WhatsApp
                    </button>
                  </div>
                </div>

                <div className="ref-instructions">
                  <h4>📋 How It Works:</h4>
                  <ol>
                    <li>Share your referral link with friends</li>
                    <li>Friends must connect their wallet using your link</li>
                    <li>Each successful referral earns you rewards</li>
                    <li>Track your referrals in real-time</li>
                  </ol>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// تابع کمکی برای استفاده در سایر کامپوننت‌ها (مثلاً در صفحه اصلی)
export const useReferralSystem = () => {
  const { wallet } = useWallet();
  
  const registerReferralIfNeeded = () => {
    if (!wallet) return;
    
    const urlRef = new URLSearchParams(window.location.search).get('ref');
    if (urlRef && urlRef !== localStorage.getItem(`ref_code_${wallet}`)) {
      // ثبت رفرال
      try {
        const refData = JSON.parse(localStorage.getItem(`ref_data_${urlRef}`) || '{"referrals": []}');
        
        if (!refData.referrals.some(ref => ref.wallet === wallet)) {
          const newReferral = {
            wallet: wallet,
            date: new Date().toISOString(),
            timestamp: Date.now()
          };
          
          refData.referrals.push(newReferral);
          localStorage.setItem(`ref_data_${urlRef}`, JSON.stringify(refData));
          
          // پاک کردن پارامتر رفرال از URL
          const newUrl = window.location.pathname;
          window.history.replaceState({}, document.title, newUrl);
          
          return true;
        }
      } catch (error) {
        console.error("Error processing referral:", error);
      }
    }
    return false;
  };
  
  return { registerReferralIfNeeded };
};