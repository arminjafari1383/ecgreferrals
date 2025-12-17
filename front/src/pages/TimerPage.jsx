import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useWallet } from "../context/WalletContext";
import "./TimerPage.css";
import Logo from "../../assets/2.png";
import Blade from "../../assets/1.png";

const API = "https://cryptoocapitalhub.com/api/wallet";

export default function TimerPage() {
  const { wallet } = useWallet();
  const [remaining, setRemaining] = useState(null);
  
  // ❗️ فیلدهای جدید برای نمایش
  const [balance, setBalance] = useState("0");
  const [totalStaked, setTotalStaked] = useState("0");
  const [totalRewards, setTotalRewards] = useState("0"); // پاداش ماین + ریفرال + سود استیک
  const [referralBonus, setReferralBonus] = useState("0");
  const [rewardCount, setRewardCount] = useState(0); // تعداد ماین‌ها
  
  const [message, setMessage] = useState("");
  const intervalRef = useRef(null);

  // تبدیل ثانیه به hh:mm:ss
  const formatTime = (sec) => {
    if (sec === null || sec === undefined) return "--:--:--";
    const h = String(Math.floor(sec / 3600)).padStart(2, "0");
    const m = String(Math.floor((sec % 3600) / 60)).padStart(2, "0");
    const s = String(sec % 60).padStart(2, "0");
    return `${h}:${m}:${s}`;
  };

  // دریافت وضعیت اولیه از بک‌اند
  const fetchStatus = async () => {
    if (!wallet) return;
    try {
      const { data } = await axios.get(`${API}/reward_status/`, {
        params: { wallet },
      });
      if (data.status === "ok") {
        setRemaining(data.seconds_remaining ?? 0);
        setBalance(data.balance_ecg ?? "0");
        setTotalStaked(data.total_staked ?? "0");
        setTotalRewards(data.total_rewards ?? "0");
        setReferralBonus(data.referral_points ?? "0"); // پاداش عضویت ۳ توکنی
        setRewardCount(data.rewards_count ?? 0);
        
        if (data.seconds_remaining > 0) {
            setMessage("⏳ Timer is running...");
        } else {
            setMessage("✅ Ready to claim daily reward!");
        }
      }
    } catch (e) {
      console.error(e);
      setMessage("❌ Cannot load timer status from server.");
    }
  };

  // وقتی تایمر به صفر می‌رسد (یا برای کلیم دستی)
  const claimReward = async () => {
    if (remaining > 0) {
        return setMessage("⚠️ Please wait for the timer to finish.");
    }
    
    try {
      setMessage("⏳ Claiming reward...");
      // ❗️ فراخوانی اندپوینت جدید ماینینگ
      const { data } = await axios.post(`${API}/tick/`, {
        wallet_address: wallet,
      });
      
      if (data.status === "rewarded") {
        setBalance(data.balance_ecg);
        setTotalRewards(data.total_rewards);
        setRewardCount(data.rewards_count);
        setMessage(`🎉 ${data.message}`);
        await fetchStatus(); // شروع دوباره تایمر
      } else {
        setMessage("⚠️ " + (data.message || "Could not claim."));
      }
    } catch (e) {
      console.error(e);
      const errorMsg = e.response?.data?.message || "Error claiming reward.";
      setMessage(`❌ ${errorMsg}`);
      // اگر خطا داد، مثلاً گفت زوده، ۵ ثانیه بعد وضعیت رو رفرش کن
      setTimeout(fetchStatus, 5000);
    }
  };

  // شمارنده محلی
  useEffect(() => {
    if (!wallet) return;

    (async () => {
      await fetchStatus(); // اول وضعیت رو بگیر
    })();
    
    // اینتروال فقط برای کاهش ثانیه‌شمار است
    intervalRef.current = setInterval(() => {
        setRemaining((sec) => {
          if (sec === null || sec === undefined) return sec;
          if (sec > 0) return sec - 1;
          return 0;
        });
      }, 1000);

    return () => clearInterval(intervalRef.current);
  }, [wallet]);

  return (
    <div className="boost-page">
      <div className="header">
        <h1>AI POLIFY</h1>
        <img src={Logo} alt="AI POLIFY Logo" />
      </div>

      {/* انیمیشن توربین (بدون تغییر) */}
      <svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg" className="lk">
        {/* ... (کد SVG شما از فایل اصلی) ... */}
         <defs>
          <linearGradient id="frontEdgeGrad" x1="0" y1="100" x2="0" y2="320" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#00e1ff" /><stop offset="100%" stopColor="#001833" />
          </linearGradient>
          <filter id="frontEdgeShadow" x="-5%" y="-5%" width="110%" height="110%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="2" result="blur" /> <feOffset dx="0" dy="1" result="offsetBlur" /> <feFlood floodColor="#001833" floodOpacity="0.5" /> <feComposite in2="offsetBlur" operator="in" result="shadow" />
            <feMerge> <feMergeNode in="shadow" /> <feMergeNode in="SourceGraphic" /> </feMerge>
          </filter>
          <clipPath id="boxClip"><rect x="60" y="100" width="280" height="220" rx="10" ry="10" /></clipPath>
          <filter id="centerBloom" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur in="SourceGraphic" stdDeviation="22" /></filter>
          <mask id="mask-blades"><rect width="100%" height="100%" fill="white" /> <circle cx="200" cy="210" r="40" fill="black" /></mask>
        </defs>
        <path d="M80 80 L320 80 L340 100 L60 100 Z" fill="none" stroke="#00e1ff" strokeWidth="4" />
        <rect x="60" y="100" width="280" height="220" rx="10" ry="10" fill="none" stroke="url(#frontEdgeGrad)" strokeWidth="4" filter="url(#frontEdgeShadow)" />
        <circle cx="80" cy="120" r="5" fill="#00e1ff" /><circle cx="320" cy="120" r="5" fill="#00e1ff" /><circle cx="80" cy="300" r="5" fill="#00e1ff" /><circle cx="320" cy="300" r="5" fill="#00e1ff" />
        <rect x="130" y="320" width="40" height="10" rx="2" fill="none" stroke="#00e1ff" strokeWidth="3" /><rect x="230" y="320" width="40" height="10" rx="2" fill="none" stroke="#00e1ff" strokeWidth="3" />
        <g clipPath="url(#boxClip)">
          <g filter="url(#centerBloom)"><circle cx="200" cy="210" r="46" fill="#00e1ff" opacity="0.25" /></g>
          <g filter="url(#centerBloom)"><circle cx="200" cy="210" r="90" fill="#00e1ff" opacity="0.08" /></g>
        </g>
        <image className="fan-blades" href={Blade} x="100" y="110" width="200" height="200" mask="url(#mask-blades)" />
        <circle cx="200" cy="210" r="40" fill="#1a1448" stroke="#00e1ff" strokeWidth="3" />
        <text x="200" y="205" textAnchor="middle" fill="white" fontSize="16" fontWeight="bold">MINER</text>
        <path d="M180 215 H190 M190 215 Q192 208 194 215 T198 215 Q200 208 202 215 T206 215 Q208 208 210 215 H220" stroke="#ffffff" strokeWidth="2" fill="none" />
        <text x="200" y="230" textAnchor="middle" fill="white" fontSize="16" fontWeight="bold">ECG</text>
      </svg>

      {!wallet ? (
        <p style={{ color: "red", textAlign: "center", fontSize: '1.2rem' }}>
          ⚠️ Please connect your wallet first.
        </p>
      ) : (
        <>
          <div className="b1">
            <h2 className="timer">{formatTime(remaining)}</h2>
          </div>
          
          {/* دکمه کلیم */}
          <button 
            className="claim-btn" 
            onClick={claimReward} 
            disabled={remaining > 0}
            style={{opacity: remaining > 0 ? 0.5 : 1, marginLeft: '50px'}}
          >
            {remaining > 0 ? "Mining..." : "Claim 1 ECG"}
          </button>

          {/* اطلاعات آماری */}
          <div className="info">💎 +3 ECG for every invited friend</div>
          
          <div className="stats">
            Balance (Withdrawable):
            <span className="highlight"> {Number(balance).toFixed(4)} ECG</span>
          </div>
          <div className="stats">
            Total Staked (Locked):
            <span className="highlight"> {Number(totalStaked).toFixed(4)} ECG</span>
          </div>
          <div className="stats">
            Total Rewards (All time):
            <span className="highlight"> {Number(totalRewards).toFixed(4)} ECG</span>
          </div>

          <div className="info">
            🕐 Total Days Mined: <span className="highlight">{rewardCount}</span> |
            Referral Bonus: <span className="highlight">{referralBonus} ECG</span>
          </div>
          
          {message && (
            <p style={{ textAlign: "center", marginTop: 8, color: '#a0c4ff' }}>{message}</p>
          )}
        </>
      )}
    </div>
  );
}