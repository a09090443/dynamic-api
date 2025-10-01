// 環境設定配置
export const appConfig = {
  // 是否為生產環境
  production: process.env.NODE_ENV === 'production',
  
  // 應用程式環境 (development, staging, production)
  appEnv: process.env.NEXT_PUBLIC_APP_ENV || 'development',
  
  // 前端 API URL (Next.js API Routes)
  apiUrl: process.env.NEXT_PUBLIC_API_URL || '/api',
  
  // 後端 API URL (供 API Routes 代理使用)
  backendUrl: process.env.BACKEND_API_URL || 'http://localhost:8080',
  
  // 應用程式名稱
  appName: process.env.NEXT_PUBLIC_APP_NAME || 'Dynamic API Tech Manager',
  
  // 除錯模式
  debugMode: process.env.NEXT_PUBLIC_DEBUG_MODE === 'true',
  
  // API 超時設定 (毫秒)
  apiTimeout: parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || '10000'),
};

// 輸出當前設定 (僅在除錯模式)
if (appConfig.debugMode && typeof window !== 'undefined') {
  console.log('🔧 App Configuration:', {
    production: appConfig.production,
    appEnv: appConfig.appEnv,
    apiUrl: appConfig.apiUrl,
    appName: appConfig.appName,
    debugMode: appConfig.debugMode,
  });
}