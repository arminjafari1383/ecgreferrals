import React, { useState, useEffect } from "react";
import { useWallet } from "../context/WalletContext";
import { useLocation } from "react-router-dom";
import "./ReferralPage.css";

const API_BASE = "http://localhost:8000/api";

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export default function ReferralPage() {
  const { wallet, connectWallet } = useWallet();

  const [referralCode, setReferralCode] = useState(""); // کد خود کاربر
  const [referralLink, setReferralLink] = useState("");
  const [totalEarned, setTotalEarned] = useState(0);
  const [totalStaked, setTotalStaked] = useState(0);
  const [copied, setCopied] = useState(false);

  const query = useQuery();

  // -----------------------------
  // گرفتن ref از URL و ذخیره در localStorage
  // -----------------------------
  useEffect(() => {
    const ref = query.get("ref");
    if (ref && ref.length > 2) {
      localStorage.setItem("inviter_referral_code", ref); // جدا از کد خود کاربر
      console.log("📌 Inviter Referral from URL:", ref);
    }
  }, [query]);

  // -----------------------------
  // اتصال کیف پول و دریافت داده رفرال
  // -----------------------------
  const fetchReferralData = async (walletAddress) => {
    if (!walletAddress) return;

    try {
      const inviterCode = localStorage.getItem("inviter_referral_code") || "";

      const res = await fetch(`${API_BASE}/wallet/connect/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wallet_address: walletAddress,
          referral_code: inviterCode, // ارسال کد دعوت کننده
        }),
      });

      if (!res.ok) throw new Error("خطا در اتصال به سرور");

      const data = await res.json();
      console.log("🟢 BACKEND RESPONSE:", data);

      // ذخیره کد خود کاربر
      setReferralCode(data.referral_code || "");
      setReferralLink(
        data.referral_code
          ? `${window.location.origin}?ref=${data.referral_code}`
          : ""
      );
      setTotalEarned(data.total_earned || 0);
      setTotalStaked(data.total_staked || 0);

      if (data.referral_code) {
        localStorage.setItem("my_referral_code", data.referral_code);
      }
    } catch (err) {
      console.error("❌ Fetch error:", err);
    }
  };

  const handleConnect = async () => {
    try {
      const walletAddress = await connectWallet();
      if (walletAddress) fetchReferralData(walletAddress);
    } catch (err) {
      console.error("❌ Wallet connect error:", err);
    }
  };

  useEffect(() => {
    if (wallet) fetchReferralData(wallet);
  }, [wallet]);

  const copyLink = () => {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="ref-page">
      <div className="ref-box">
        <h2 className="ref-title">👥 Referral Dashboard</h2>

        {!wallet && <button onClick={handleConnect}>🔗 Connect Wallet</button>}

        {wallet && (
          <>
            <p><strong>Wallet:</strong> {wallet}</p>

            <div className="referral-code-display">
              <h4>🎯 کد رفرال شما:</h4>
              <code className="referral-code">
                {referralCode || "❌ دریافت نشد"}
              </code>
            </div>

            <div className="referral-link">
              <h4>🔗 لینک دعوت:</h4>
              <input
                type="text"
                value={referralLink}
                readOnly
                className="link-input"
              />
              <button onClick={copyLink} className="copy-button">
                📋 کپی لینک
              </button>
              {copied && <span className="copy-success">Copied!</span>}
            </div>

            <hr />

            <p>💰 Total Earned: {totalEarned}</p>
            <p>📊 Total Staked: {totalStaked}</p>
          </>
        )}
      </div>
    </div>
  );
}
