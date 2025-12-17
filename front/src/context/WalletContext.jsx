import React, { createContext, useState, useContext, useMemo } from "react";

const WalletContext = createContext();

export function WalletProvider({ children }) {
  const [tonWallet, setTonWallet] = useState(null);
  const [evmWallet, setEvmWallet] = useState(null);

  // ما wallet اصلی رو بر اساس اولویت برمی‌گردونیم
  // این همون متغیری هست که ProtectedRoute شما استفاده می‌کنه
  const activeWallet = useMemo(() => evmWallet || tonWallet, [tonWallet, evmWallet]);
  const activeNetwork = useMemo(() => evmWallet ? "bep20" : (tonWallet ? "ton" : null), [tonWallet, evmWallet]);


  return (
    <WalletContext.Provider
      value={{
        wallet: activeWallet, // برای سازگاری با ProtectedRoute
        network: activeNetwork,
        tonWallet,
        setTonWallet,
        evmWallet,
        setEvmWallet,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  return useContext(WalletContext);
}