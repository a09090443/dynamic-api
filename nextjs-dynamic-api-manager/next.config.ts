import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
  
  // 輸出配置
  output: 'standalone',
  
  // 重新導向配置
  async redirects() {
    return [
      {
        source: '/',
        destination: '/endpoint',
        permanent: false,
      },
    ];
  },
  
  // API 路由配置
  async rewrites() {
    return [
      // 確保 API 路由正確處理
      {
        source: '/api/dynamic-api/:path*',
        destination: '/api/dynamic-api/:path*',
      },
    ];
  },
  
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
