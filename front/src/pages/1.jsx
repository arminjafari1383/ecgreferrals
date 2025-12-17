import React, { useState,useEffect } from "react";
import { useWallet } from "../context/WalletContext";
import "./ReferralPage.css";

const API_BASE = "https://cryptoocapitalhub.com/api";
export default function ReferralPage(){
    const { wallet } = useWallet();
    const [referrals,setReferrals]=useState([]);
    const [stats,setStats] = useState(null);
    const [msg,setMsg] = useState("");
    const [myLink,setMyLink] = useState("");

    useEffect(() => {
        if (wallet) {
            fetchReferrals(wallet);
            loadReferralLink();
        }
    },[wallet]);

    function loadReferralLink(){
        const link = localStorage.getItem("myReferralLink");
        if (link) {
            setMyLink(link);
        } else {
            fetchStatus(wallet);
        }
    }
    async function fetchStatus(walletAddr) {
        try {
            const res = await fetch (`${API_BASE}/wallet/reward_status/?wallet=${walletAddr}`);
            const data = await res.json();
            if (data.referral_code) {
                const link = `https://cryptoocapitalhub.com/r/${data.referral_code}/`;
                setMyLink(link);
                localStorage.setItem("myReferralLink",link);
            }
        }catch (e) {
            console.error("Error fetching status for ref link",e);
        }
    }
    async function fetchReferrals(walletAddr) {
        try {
            setMsg("Loading referral data...");
            const res = await fetch(`${API_BASE}/wallet/referrals/?wallet=${walletAddr}`);
            const data = await res.json();
            if (data.status === "ok") {
                setReferrals(data.referrals || []);
                setStats(data);
                setMsg("");
            }else {
                setMsg(data.detail || "Failed to load referrals.");
            }
        }catch (err) {
            console.error("Referral fetch error:",err);
            setMsg("Error connecting to server.");
        }
    }
    const fmt = (v,decimals = 4) => {
        if (v === null || v === undefined) return "0";
        const n = Number(v);
        return isNaN(n)
        ? "0"
        : n.toLocaleString(undefined,{ maximumFractionDigits: decimals });
    };
    return (
        <div className="ref-page">
            <div className="ref-box">
                <h2 className="ref-title"> Referral Rewards Dashboard</h2>
                {!wallet ? (
                    <p className="ref-warning">Please connect your wallet first</p>

                ):(
                    <>
                    <p className="ref-connected-wallet">
                        Connected Wallet:{" "}
                        <b>
                            {wallet.slice(0.6)}...{wallet.slice(-4)}
                        </b>
                    </p>
                    {myLink && (
                        <div className="ref-link-box">
                            <h3 className="ref-link-title">Your Refferal Link</h3>
                            <div className="ref-link-inner">
                                <code className="ref-link-code">{myLink}</code>
                                <button
                                onClick={() => {
                                    navigator.clipboard.writeText(myLink);
                                    setMsg("Referral link copied!");
                                }}
                                className="ref-link-copy"
                                >
                                    Copy
                                </button>
                            </div>

                        </div>
                    )}
                    {msg && <p style = {{ textAlign:"center",margin:"1rem 0" }}>{msg}</p>}
                    {stats && (
                        <div className="ref-summary-box">
                            <h3 className="ref-summary-title">Summary</h3>
                            <div className="ref-summary-grid">
                                <div className="ref-summary-item">
                                    Total Referrals:
                                    <br />
                                    <b>{fmt(stats.total_referrals,0)}</b>
                                </div>
                                <div className="ref-summary-item">
                                    Total Earned (5% bouns);
                                    <br />
                                    <b> {fmt(stats.invite_bouns_total)}</b>ECG
                                </div>
                                <div className="ref-summary-item">
                                    Total Earned (3 ECG bouns):
                                    <br />
                                    <b>{fmt(stats.total_referrals * 3,0)}</b>ECG
                                </div>
                            </div>
                        </div>
                    )}
                    
                    </>
                )}
            </div>

        </div>
    )
}