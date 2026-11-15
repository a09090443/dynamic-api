import type { NextConfig } from "next";

const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';
// Playwright E2E 專用開關：設為 '1' 時不做靜態匯出，讓 next start 可以啟動（basePath、trailingSlash 不變）
const isE2E = process.env.DYNAMIC_API_E2E === '1';

const nextConfig: NextConfig = {
  // 環境變數配置
  env: {
    BACKEND_API_URL: process.env.BACKEND_API_URL,
  },
  
  // 只在生產模式啟用尾隨斜線（開發模式不需要）
  trailingSlash: isProduction,
  
  // 只在生產建置時設置 basePath（開發模式不需要）
  ...(isProduction && { basePath: '/dynamic-api' }),
  
  // 編譯配置
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  
  // 只在生產建置時使用靜態導出（E2E 建置除外）
  ...(isProduction && !isE2E && { output: 'export' }),
  
  // 圖片優化配置
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
