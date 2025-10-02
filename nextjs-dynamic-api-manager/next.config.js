/** @type {import('next').NextConfig} */
const nextConfig = {
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

  // 開發模式不使用 export，生產構建時使用 export
  // output: 'export', // 僅在構建生產版本時取消註釋
  
  // 靜態導出時的基礎路徑 (僅用於生產構建)
  // basePath: '/dynamic-api', // 僅在構建生產版本時取消註釋
  
  // 圖片優化配置
  images: {
    unoptimized: false, // 開發模式下使用優化
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

module.exports = nextConfig;
