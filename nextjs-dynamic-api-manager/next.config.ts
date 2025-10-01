import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 環境變數配置
  env: {
    BACKEND_API_URL: process.env.BACKEND_API_URL,
  },
  
  // 禁用自動添加尾隨斜線
  trailingSlash: false,
  
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
  
  // 輸出配置
  output: 'standalone',
  
  // Headers 配置
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ];
  },
};

export default nextConfig;
