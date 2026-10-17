// 環境設定配置
export const appConfig = {
  // 是否為生產環境
  production: process.env.NODE_ENV === 'production',
  
  // 應用程式環境 (development, staging, production)
  appEnv: process.env.NEXT_PUBLIC_APP_ENV || 'development',
  
  // 前端 API URL - 智能檢測運行環境
  apiUrl: (() => {
    const envUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
    // 如果在瀏覽器中且 envUrl 指向 localhost:3000（開發模式）
    // 但實際上頁面是從其他端口訪問的（如 8080），說明是靜態部署
    if (typeof window !== 'undefined') {
      const currentHost = window.location.host;
      // 如果當前不是從 localhost:3000 訪問，使用相對路徑（空字串，讓 axios 使用相對路徑）
      if (!currentHost.includes('localhost:3000') && !currentHost.includes(':3000')) {
        return '';  // 靜態部署：使用相對路徑，因為已經在 /dynamic-api 路徑下
      }
    }
    return envUrl;  // 開發模式：使用環境變數配置
  })(),
  
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
    currentHost: window.location.host,
    appName: appConfig.appName,
    debugMode: appConfig.debugMode,
  });
}