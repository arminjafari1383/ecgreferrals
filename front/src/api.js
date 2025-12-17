const API_BASE = import.meta.env.VITE_API_BASE || "https://cryptoocapitalhub.com/";

export async function connectWallet(wallet_address, referral_code = "") {
  const ref = referral_code || localStorage.getItem("referral_code") || "";
  const url = ref
    ? `${API_BASE}/wallet/connect/?ref=${encodeURIComponent(ref)}`
    : `${API_BASE}/wallet/connect/`;

  console.log("🌍 API POST:", url, { wallet_address, referral_code: ref });

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ wallet_address, referral_code: ref }),
  });
  return res.json();
}
