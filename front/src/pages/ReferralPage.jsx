import React, { useState, useEffect } from "react";
import { useWallet } from "../context/WalletContext";
import "./ReferralPage.css";

// =============================
// CONFIG
// =============================
const API_BASE = "https://cryptoocapitalhub.com/api";
const BOT_USERNAME = "pooooooooooobot"; // ← یوزرنیم ربات تلگرام بدون @
const APP_BASE_URL = "https://cryptoocapitalhub.com"; // ← لینک Mini App

export default function ReferralPage() {
  const { wallet } = useWallet();
  const [referrals, setReferrals] = useState([]);
  const [stats, setStats] = useState(null);
  const [msg, setMsg] = useState("");
  const [myLinkTelegram, setMyLinkTelegram] = useState("");
  const [myLinkBrowser, setMyLinkBrowser] = useState("");

  const tg = window.Telegram?.WebApp;

  // -----------------------------
  // Load data after wallet connect
  // -----------------------------
  useEffect(() => {
    if (wallet) {
      fetchReferrals(wallet);
      fetchReferralLinks(wallet);
    }
  }, [wallet]);

  // -----------------------------
  // Get personal referral links
  // -----------------------------
  async function fetchReferralLinks(walletAddr) {
    try {
      const res = await fetch(`${API_BASE}/wallet/reward_status/?wallet=${walletAddr}`);
      const data = await res.json();

      if (data.referral_code) {
        const linkTelegram = `https://t.me/${BOT_USERNAME}/app?startapp=${data.referral_code}`;
        const linkBrowser = `${APP_BASE_URL}/?ref=${data.referral_code}`;

        setMyLinkTelegram(linkTelegram);
        setMyLinkBrowser(linkBrowser);

        localStorage.setItem("myReferralLinkTelegram", linkTelegram);
        localStorage.setItem("myReferralLinkBrowser", linkBrowser);
      }
    } catch (e) {
      console.error("Error fetching referral links", e);
    }
  }

  // -----------------------------
  // Fetch referrals list (for referrer only)
  // -----------------------------
  async function fetchReferrals(walletAddr) {
    try {
      setMsg("🔄 Loading referral data...");
      const res = await fetch(`${API_BASE}/wallet/referrals/?wallet=${walletAddr}`);
      const data = await res.json();

      if (data.status === "ok") {
        setReferrals(data.referrals || []);
        setStats(data);
        setMsg("");
      } else {
        setMsg("⚠️ Failed to load referrals");
      }
    } catch (err) {
      console.error(err);
      setMsg("❌ Server connection error");
    }
  }

  // -----------------------------
  // Utils
  // -----------------------------
  const fmt = (v, decimals = 4) => {
    if (!v) return "0";
    const n = Number(v);
    return isNaN(n) ? "0" : n.toLocaleString(undefined, { maximumFractionDigits: decimals });
  };

  // -----------------------------
  // Share in Telegram (FIXED)
  // -----------------------------
  function shareInTelegram() {
    if (!myLinkTelegram) return;

    const text = "🚀 Join this app using my personal referral link and get bonus rewards!";
    const url = `https://t.me/share/url?url=${encodeURIComponent(myLinkTelegram)}&text=${encodeURIComponent(text)}`;

    // اگر WebApp تلگرام موجود است، از tg.openLink استفاده کن
    if (tg && tg.openLink) {
      tg.openLink(url);
    } else {
      // fallback: باز کردن لینک در پنجره جدید مرورگر
      window.open(url, "_blank");
    }
  }

  // =============================
  // RENDER
  // =============================
  return (
    <div className="ref-page">
      <div className="ref-box">
        <h2 className="ref-title">👥 Referral Dashboard</h2>

        {!wallet ? (
          <p className="ref-warning">⚠️ Please connect your wallet first.</p>
        ) : (
          <>
            <p className="ref-connected-wallet">
              Connected Wallet: <b>{wallet.slice(0, 6)}...{wallet.slice(-4)}</b>
            </p>

            {/* ================= Referral Links ================= */}
            {myLinkTelegram && myLinkBrowser && (
              <div className="ref-link-box">
                <h3 className="ref-link-title">🔗 Your Personal Referral Links</h3>

                <div className="ref-link-inner">
                  <p>Telegram: <code>{myLinkTelegram}</code></p>
                  <p>Browser: <code>{myLinkBrowser}</code></p>
                </div>

                <button
                  className="ref-link-copy"
                  onClick={shareInTelegram}
                  style={{ marginTop: "12px", width: "100%" }}
                >
                  📤 Share in Telegram
                </button>
              </div>
            )}

            {msg && <p style={{ textAlign: "center", margin: "1rem 0" }}>{msg}</p>}

            {/* ================= Summary ================= */}
            {stats && (
              <div className="ref-summary-box">
                <h3 className="ref-summary-title">📊 Summary</h3>
                <div className="ref-summary-grid">
                  <div className="ref-summary-item">
                    👥 Total Referrals
                    <br /><b>{fmt(stats.total_referrals, 0)}</b>
                  </div>
                  <div className="ref-summary-item">
                    💰 Total Earned (5%)
                    <br /><b>{fmt(stats.invite_bonus_total)} ECG</b>
                  </div>
                  <div className="ref-summary-item">
                    🎁 Referral Bonus
                    <br /><b>{fmt(stats.total_referrals * 3, 0)} ECG</b>
                  </div>
                </div>
              </div>
            )}

            {/* ================= Table ================= */}
            <div className="ref-table-wrapper">
              <table className="ref-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Total Staked</th>
                    <th>Reward Earned</th>
                  </tr>
                </thead>
                <tbody>
                  {referrals.length > 0 ? (
                    referrals.map((r, i) => (
                      <tr key={i}>
                        <td>{r.wallet || "-"}</td>
                        <td>{fmt(r.total_staked)} ECG</td>
                        <td>{fmt(r.reward_from_this_user)} ECG</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" style={{ textAlign: "center" }}>No referrals yet</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* اضافه کردن فضای اضافی برای استایل */}
            {[...Array(10)].map((_, i) => <br key={i} />)}
          </>
        )}
      </div>
    </div>
  );
}
