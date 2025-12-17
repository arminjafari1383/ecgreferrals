import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// اگر esbuild نصب نشده:
// npm i -D esbuild

export default defineConfig({
  plugins: [react()],
  build: {
    // 🚀 سریع‌ترین minifier
    minify: "esbuild",

    // 🚀 سرعت‌دهی به تولید sourcemap
    sourcemap: false,

    // 🚀 بهبود سرعت رول‌آپ برای پروژه‌های سنگین
    cssMinify: "esbuild",
    target: "esnext",

    // 🚀 جلوگیری از freeze شدن در Docker هنگام Terser
    chunkSizeWarningLimit: 1500,

    // 🚀 کش بهتر برای Docker
    brotliSize: false,
  },
  esbuild: {
    // 🚀 تسریع Build و جلوگیری از گیر کردن
    legalComments: "none",
  }
});
