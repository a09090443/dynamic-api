# 環境設定說明

## 環境變數檔案

本專案支援多種環境配置：

### 📁 環境檔案層級 (優先級由高到低)
1. `.env.local` - 本地覆蓋 (所有環境，應該被 git 忽略)
2. `.env.development` - 開發環境
3. `.env.production` - 生產環境
4. `.env` - 預設值 (所有環境)

### 🔧 設定說明

#### 必要環境變數
- `NODE_ENV`: Node.js 環境 (development/production)
- `NEXT_PUBLIC_APP_ENV`: 應用程式環境標識
- `BACKEND_API_URL`: 後端 API 基礎 URL (供 API Routes 使用)
- `NEXT_PUBLIC_API_URL`: 前端 API URL (客戶端使用)

#### 可選環境變數
- `NEXT_PUBLIC_APP_NAME`: 應用程式顯示名稱
- `NEXT_PUBLIC_DEBUG_MODE`: 除錯模式 (true/false)
- `NEXT_PUBLIC_API_TIMEOUT`: API 請求超時時間 (毫秒)

### 🚀 使用方式

#### 1. 建立本地設定檔
```bash
cp .env.local.example .env.local
```

#### 2. 根據你的環境修改 `.env.local`
```env
# 本地開發設定
BACKEND_API_URL=http://localhost:8080
NEXT_PUBLIC_DEBUG_MODE=true
```

#### 3. 啟動對應環境
```bash
# 開發環境
npm run dev

# 開發環境 (啟用除錯)
npm run dev:debug

# 生產建置
npm run build:prod

# 生產啟動
npm run start:prod
```

### 🔄 環境切換

不同環境的後端 API 設定：

| 環境 | 後端 URL | 說明 |
|------|----------|------|
| 開發 | `http://localhost:8080` | 本地後端服務 |
| 測試 | `http://test-server:8080` | 測試伺服器 |
| 生產 | `http://prod-server:8080` | 生產伺服器 |

### ⚠️ 注意事項

1. **以 `NEXT_PUBLIC_` 開頭的變數** 會暴露給客戶端
2. **不以此開頭的變數** 只在伺服器端可用
3. **敏感資訊** (如 API Keys) 不應使用 `NEXT_PUBLIC_` 前綴
4. **.env.local** 檔案不應提交到版本控制