import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import WalletPage from "./pages/WalletPage";
import TimerPage from "./pages/TimerPage";
import PurchasePage from "./pages/PurchasePage";
import ReferralPage from "./pages/ReferralPage";
import Aboutus from  "./pages/Aboutus"
import { WalletProvider, useWallet } from "./context/WalletContext";
import "./style.css";

export default function App() {
  return (
    <WalletProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          {/* صفحه اتصال کیف پول (بدون محافظت) */}
          <Route path="/wallets" element={<WalletPage />} />

          {/* صفحه خرید */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <PurchasePage />
              </ProtectedRoute>
            }
          />
          

          {/* صفحه ماین */}
          <Route
            path="/mine"
            element={
              <ProtectedRoute>
                <TimerPage />
              </ProtectedRoute>
            }
          />
            <Route
            path="/aboutus"
            element={
              <ProtectedRoute>
                <Aboutus />
              </ProtectedRoute>
            }
          />

          {/* صفحه دعوت‌ها */}
          <Route
            path="/friend"
            element={
              <ProtectedRoute>
                <ReferralPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </WalletProvider>
  );
}

// 🛡 مسیر محافظت‌شده — نسخه اصلاح‌شده
function ProtectedRoute({ children }) {
  const { wallet } = useWallet();

  if (!wallet) {
    // اگر ولت وصل نیست → بفرست صفحه اتصال ولت
    return <Navigate to="/wallets" replace />;
  }

  return children;
}
