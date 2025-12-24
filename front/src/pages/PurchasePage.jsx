import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTonConnectUI, useTonWallet } from "@tonconnect/ui-react";

import logo from "../../assets/chart.jpg";
import "./PurchasePage.css";

const PROJECT_TON_WALLET =
  "UQBnIrZ0TjM-iL0nowg7p9mDrO3Ge4E0_HSTSaB3xf5uKdE8";

function toNanoTON(amount) {
  return Math.floor(Number(amount) * 1e9).toString();
}

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

export default function PurchasePage() {
  const navigate = useNavigate();
  const tonWallet = useTonWallet();
  const [tonConnectUI] = useTonConnectUI();

  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [tonPrice, setTonPrice] = useState(null);

  // دریافت قیمت TON به USDT
  useEffect(() => {
    async function fetchTonPrice() {
      try {
        const res = await fetch(
          "https://api.coingecko.com/api/v3/simple/price?ids=the-open-network&vs_currencies=usd"
        );
        const data = await res.json();
        setTonPrice(data["the-open-network"].usd);
      } catch (err) {
        console.error("TON price error:", err);
      }
    }
    fetchTonPrice();
  }, []);

  // ⭐ 1 USDT = 200 ECG
  const ECG_PER_USDT = 200;

  const equivalentECG =
    tonPrice && amount
      ? (Number(amount) * tonPrice * ECG_PER_USDT).toFixed(2)
      : "0.00";

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
      console.error(err);
      setMessage("❌ Transaction failed.");
    }
  }

  return (
    <div className="page-container">
      <button onClick={() => navigate(-1)} className="back-btn">
        ← Back
      </button>

      <h2 className="title">Stake (Deposit)</h2>

      <div className="logo-box">
        <img src={logo} alt="chart" className="logo-img" />
      </div>

      {tonPrice && (
        <p className="price-box">
          TON Price: ${tonPrice} USDT
        </p>
      )}

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
