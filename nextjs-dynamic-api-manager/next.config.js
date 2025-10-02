/** @type {import('next').NextConfig} */
const nextConfig = {
  // 環境變數配置
  env: {
    BACKEND_API_URL: process.env.BACKEND_API_URL,
  },

  // 編譯配置
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },

  // 實驗性功能
  experimental: {
    // 啟用 Turbopack (已在 package.json scripts 中使用)
  },

  // 生產模式配置 - 用於 Gradle 建置
  ...(process.env.NODE_ENV === 'production' && {
    output: 'export', // 靜態導出
    basePath: '/dynamic-api', // 與 Spring Boot 路徑匹配
    trailingSlash: true, // 只在生產模式啟用尾隨斜線
  }),
  
  // 圖片優化配置
  images: {
    unoptimized: true, // 靜態導出需要禁用圖片優化
  },
};

module.exports = nextConfig;
