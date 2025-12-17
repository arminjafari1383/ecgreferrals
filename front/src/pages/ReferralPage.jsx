import React, { useState, useEffect } from "react";
import { useWallet } from "../context/WalletContext";
import "./ReferralPage.css";

const BOT_USERNAME = "pooooooooooobot"; // یوزرنیم بات تلگرام بدون @
const APP_BASE_URL = "https://cryptoocapitalhub.com";

export default function ReferralPage() {
  const { wallet } = useWallet();
  const [myLinkTelegram, setMyLinkTelegram] = useState("");
  const [myLinkBrowser, setMyLinkBrowser] = useState("");

  const tg = window.Telegram?.WebApp;

  useEffect(() => {
    if (wallet) {
      const referralCode = wallet.slice(0, 6) + wallet.slice(-4);
      setMyLinkTelegram(`https://t.me/${BOT_USERNAME}?start=${referralCode}`);
      setMyLinkBrowser(`${APP_BASE_URL}/?ref=${referralCode}`);
    }
  }, [wallet]);

  const openTelegramBot = () => {
    if (!myLinkTelegram) return;
    if (tg?.openLink) tg.openLink(myLinkTelegram);
    else window.open(myLinkTelegram, "_blank");
  };

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

            {myLinkTelegram && myLinkBrowser && (
              <div className="ref-link-box">
                <h3 className="ref-link-title">🔗 Your Personal Referral Links</h3>
                <div className="ref-link-inner">
                  <p>Telegram Bot: <code>{myLinkTelegram}</code></p>
                  <p>Browser: <code>{myLinkBrowser}</code></p>
                </div>

                <button
                  className="ref-link-copy"
                  onClick={openTelegramBot}
                  style={{ marginTop: "12px", width: "100%" }}
                >
                  📤 Share via Telegram Bot
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
