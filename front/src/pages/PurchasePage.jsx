import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTonConnectUI, useTonWallet } from "@tonconnect/ui-react";

import logo from "../../assets/chart.jpg";
import "./PurchasePage.css";

// ===============================
// ⭐ آدرس کیف پول پروژه (TON)
// ===============================
const PROJECT_TON_WALLET =
  "UQBnIrZ0TjM-iL0nowg7p9mDrO3Ge4E0_HSTSaB3xf5uKdE8";

// ===============================
// ⭐ TON → nanoTON
// ===============================
function toNanoTON(amount) {
  return Math.floor(Number(amount) * 1e9).toString();
}

// ===============================
// ⭐ ساخت تراکنش TON
// ===============================
function buildTONTransfer(amountTON) {
  return {
    validUntil: Math.floor(Date.now() / 1000) + 300,
    messages: [
      {
        address: PROJECT_TON_WALLET,
        amount: toNanoTON(amountTON),
      },
    ],
  };
}

// ===============================
// ⭐ صفحه خرید
// ===============================
export default function PurchasePage() {
  const navigate = useNavigate();
  const tonWallet = useTonWallet();
  const [tonConnectUI] = useTonConnectUI();

  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");

  // نرخ تبدیل نمونه
  const ECG_RATE = 900; // 1 TON = 900 ECG
  const equivalentECG = (Number(amount) * ECG_RATE || 0).toFixed(2);

  // ===============================
  // ⭐ انجام پرداخت با TON
  // ===============================
  async function handleDeposit() {
    try {
      if (!tonWallet) {
        return setMessage("⚠️ Please connect your TON wallet first.");
      }

      if (!amount || Number(amount) <= 0) {
        return setMessage("⚠️ Enter a valid TON amount.");
      }

      setMessage("⏳ Sending TON transaction...");

      const tx = buildTONTransfer(amount);

      await tonConnectUI.sendTransaction(tx);

      setMessage("✅ TON payment sent successfully!");
    } catch (err) {
      console.error("❌ TON Payment Error:", err);
      setMessage("❌ Transaction rejected or failed.");
    }
  }

  return (
    <div className="page-container">
      <button onClick={() => navigate(-1)} className="back-btn">
        <div className="back-circle">←</div>
        <span>Back</span>
      </button>

      <h2 className="title">Stake (Deposit)</h2>

      <div className="logo-box">
        <img src={logo} alt="chart" className="logo-img" />
      </div>

      <p className="label-text">You Pay (TON)</p>
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="input-box"
        placeholder="0.0"
      />

      <p className="label-text" style={{ marginTop: "1.5rem" }}>
        You Receive (ECG)
      </p>
      <input readOnly value={equivalentECG} className="input-box" />

      {message && <p className="msg-box">{message}</p>}

      <button onClick={handleDeposit} className="convert-btn">
        Convert TON to ECG
      </button>
    </div>
  );
}
