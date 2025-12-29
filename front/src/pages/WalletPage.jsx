import React, { useState, useEffect } from "react";
import { useWallet } from "../context/WalletContext";
import { TonConnectButton, useTonWallet, useTonConnectUI } from "@tonconnect/ui-react";
import "./WalletPage.css";


const API_BASE = "http://localhost:8000/api";


async function registerWallet(address, networkType) {
  try {
    const ref = localStorage.getItem("referral_code") || "";

    const res = await fetch(`${API_BASE}/wallet/connect/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        wallet_address: address,
        referral_code: ref,
        network: networkType,
      }),
    });

    const data = await res.json();

    if (data.referral_link) {
      localStorage.setItem("myReferralLink", data.referral_link);
    }

    if (data.status === "ok") {
      return "✅ Connected successfully!";
    } else {
      return "⚠️ " + (data.detail || data.message);
    }
  } catch {
    return "❌ Failed to connect wallet.";
  }
}



export default function WalletPage() {
  const [message, setMessage] = useState("");
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawAddress, setWithdrawAddress] = useState("");
  const { setTonWallet, network, wallet: activeWalletAddress } = useWallet();
  const tonWallet = useTonWallet();
  const [tonConnectUI] = useTonConnectUI();



  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref) {
      localStorage.setItem("referral_code", ref);
    }
  }, []);


  useEffect(() => {
    const unsubscribe = tonConnectUI.onStatusChange((wallet) => {
      if (wallet) {
        const address = wallet.account.address;

        setTonWallet(address);

        (async () => {
          setMessage("📡 Registering TON wallet...");
          const msg = await registerWallet(address, "ton");
          setMessage(msg);
        })();
      } else {
        setTonWallet(null);
        setMessage("❌ Wallet disconnected.");
      }
    });

    return () => unsubscribe();
  }, []);



  async function handleWithdraw() {
    if (!withdrawAmount || Number(withdrawAmount) < 60)
      return setMessage("⚠️ Minimum withdrawal is 60 ECG.");

    if (!withdrawAddress.trim())
      return setMessage("⚠️ Please enter destination wallet.");

    if (!activeWalletAddress)
      return setMessage("⚠️ Wallet not connected.");

    try {
      setMessage("⏳ Submitting withdrawal request...");

      const res = await fetch(`${API_BASE}/wallet/request_withdraw/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wallet_address: activeWalletAddress,
          amount: withdrawAmount,
          to_address: withdrawAddress,
          network: network,
        }),
      });

      const data = await res.json();

      if (data.status === "ok") {
        setMessage("✅ Withdrawal request submitted!");
      } else {
        setMessage("⚠️ " + (data.message || "Withdrawal failed."));
      }
    } catch {
      setMessage("❌ Withdrawal failed.");
    }

    setShowWithdraw(false);
    setWithdrawAmount("");
    setWithdrawAddress("");
  }



  return (
    <div className="wallet-page-container">
      <div className="wallet-box">
        <h2 className="wallet-title">connect Wallet</h2>

        <TonConnectButton />


        {message && <p className="msg-box">{message}</p>}

        {activeWalletAddress && (
          <button
            onClick={() => setShowWithdraw(true)}
            className="withdraw-btn"
          >
            💸 Withdraw ECG
          </button>
        )}
      </div>

      {showWithdraw && (
        <div className="withdraw-modal">
          <div className="withdraw-box">
            <h3 className="withdraw-title">Withdraw ECG</h3>
            <p className="withdraw-note">Min: 60 ECG (Admin approval required)</p>

            <input
              type="number"
              placeholder="Amount (Min 60)"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              className="withdraw-input"
            />

            <input
              type="text"
              placeholder="Destination Wallet Address"
              value={withdrawAddress}
              onChange={(e) => setWithdrawAddress(e.target.value)}
              className="withdraw-input"
            />

            <button onClick={handleWithdraw} className="withdraw-submit">
              Confirm Withdraw
            </button>

            <button
              onClick={() => setShowWithdraw(false)}
              className="withdraw-cancel"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
