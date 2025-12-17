import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/chart.jpg";
import { useTonConnectUI, useTonWallet } from "@tonconnect/ui-react";

import "./PurchasePage.css";

// ===============================
// ⭐ ثابت‌ها
// ===============================
const TON_USDT_MASTER = "0x1829e746122ae514f78c4d9cdafbffe939d621b1";
const PROJECT_TON_WALLET = "UQBe9fk9oAvcoRTNFrXygFyuhU0aJZhHsUG8aR6_okiLUP4F";

// ===============================
// ⭐ تبدیل USDT → nanoUSDT
// ===============================
function toNanoUSDT(amount) {
  return Math.floor(Number(amount) * 1e6);
}

// ===============================
// ⭐ دریافت Jetton Wallet و موجودی USDT
// ===============================
async function getUserUSDTBalance(userWallet) {
  const url = `https://tonapi.io/v2/jettons/wallets/${userWallet}?jetton=${TON_USDT_MASTER}`;

  try {
    const res = await fetch(url);

    if (res.status === 404) {
      console.log("❌ User has no USDT jetton wallet yet");
      return { wallet: null, balance: 0 };
    }

    const data = await res.json();

    return {
      wallet: data.address,
      balance: Number(data.balance) || 0, // nanoUSDT
    };
  } catch (err) {
    console.error("❌ Jetton API Error:", err);
    return { wallet: null, balance: 0 };
  }
}

// ===============================
// ⭐ ساخت payload ساده (بدون ton-core)
// ===============================
function buildJettonPayload(to, amountNano) {
  console.log("🟧 Building payload...");

  const encoder = new TextEncoder();
  const OP = 0xf8a7ea5; // jetton_transfer opcode

  const bytes = [];

  // op code (32bit)
  bytes.push((OP >> 24) & 0xff);
  bytes.push((OP >> 16) & 0xff);
  bytes.push((OP >> 8) & 0xff);
  bytes.push(OP & 0xff);

  // query_id (64bit)
  for (let i = 0; i < 8; i++) bytes.push(0x00);

  // amount
  const hex = amountNano.toString(16).padStart(2, "0");
  bytes.push(0x00); // prefix
  for (let i = 0; i < hex.length; i += 2) {
    bytes.push(parseInt(hex.substring(i, i + 2), 16));
  }

  // destination address
  bytes.push(0x00);
  bytes.push(...encoder.encode(to));

  // response_destination empty
  bytes.push(0x00);

  // no custom payload
  bytes.push(0x00);

  // forward_amount=0
  bytes.push(0x00);

  // forward_payload flag=0
  bytes.push(0x00);

  return btoa(String.fromCharCode(...bytes));
}

// ===============================
// ⭐ ساخت تراکنش USDT
// ===============================
async function buildUSDTTransfer(userAddress, amount) {
  console.log("🟦 Validating USDT balance...");

  const amountNano = toNanoUSDT(amount);

  const { wallet: jettonWallet, balance } = await getUserUSDTBalance(userAddress);

  // اگر کاربر USDT نداشته باشد
  if (!jettonWallet) {
    throw new Error("You do not own any USDT on TON.");
  }

  console.log("🟪 User USDT balance:", balance);

  // اگر موجودی کافی نباشد
  if (balance < amountNano) {
    throw new Error("Insufficient USDT balance.");
  }

  console.log("🟩 Balance OK. Building TX...");

  const payload = buildJettonPayload(PROJECT_TON_WALLET, amountNano);

  return {
    validUntil: Math.floor(Date.now() / 1000) + 300,
    messages: [
      {
        address: jettonWallet,
        amount: "150000000", // 0.15 TON gas fee
        payload,
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

  const [amount, setAmount] = useState("0.00");
  const [message, setMessage] = useState("");

  const ECG_RATE = 90;
  const equivalentECG = (Number(amount) * ECG_RATE || 0).toFixed(2);

  // ===============================
  // ⭐ انجام پرداخت
  // ===============================
  async function handleDeposit() {
    console.log("🟦 handleDeposit clicked");

    try {
      if (!tonWallet) {
        return setMessage("⚠️ Please connect your TON wallet first.");
      }

      if (!amount || Number(amount) <= 0) {
        return setMessage("⚠️ Enter a valid USDT amount.");
      }

      setMessage("⏳ Checking your USDT balance...");

      const userAddress = tonWallet.account.address;

      const tx = await buildUSDTTransfer(userAddress, amount);

      setMessage("⏳ Sending transaction...");

      await tonConnectUI.sendTransaction(tx);

      setMessage("⏳ Transaction sent. Waiting for confirmation...");
    } catch (err) {
      console.error("❌ Deposit Error:", err);
      setMessage("❌ " + err.message);
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

      <p className="label-text">You Pay (USDT - TON)</p>
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="input-box"
        placeholder="0.00"
      />

      <p className="label-text" style={{ marginTop: "1.5rem" }}>
        You Receive (ECG)
      </p>
      <input readOnly value={equivalentECG} className="input-box" />

      {message && <p className="msg-box">{message}</p>}

      <button onClick={handleDeposit} className="convert-btn">
        Convert USDT to ECG
      </button>
    </div>
  );
}
