# Dynamic API Tech Manager

[![Next.js](https://img.shields.io/badge/Next.js-15.5.4-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Latest-blue)](https://www.typescriptlang.org/)
[![Material-UI](https://img.shields.io/badge/Material--UI-Latest-0081CB)](https://mui.com/)

一個基於 Next.js 的動態 API 管理介面（明亮版），替代原版 Angular 應用程式。

## 🚀 專案概述

本專案是一個 Web 應用程式，用於管理動態 API 服務，包括 SOAP Endpoint 和 RESTful 服務的管理，以及相應的 Mock 回應設定。版面為左側側欄＋頂列麵包屑，視覺規格見 `design/admin-light-redesign/`。

## ✨ 主要功能

### 🔧 SOAP Endpoint (`/endpoint`)
- ✅ 統計卡、搜尋（發布名稱、Bean、Class 路徑）、狀態篩選與分頁
- ✅ 新增/編輯/刪除 Endpoint、JAR 檔案上傳
- ✅ 啟用/停用（確認框，成功 toast 可復原）
- ✅ 勾選後批次啟用、批次停用、刪除
- ✅ 各服務 Mock 回應筆數與連結

### 🌐 RESTful API (`/restful`)
- ✅ 新增/編輯/刪除 Restful Controller、JAR 檔案上傳
- ✅ 啟用/停用（確認框，成功 toast 可復原）、批次刪除
- ✅ 搜尋與分頁

### 📝 Mock 回應 (`/response`)
- ✅ 服務資訊卡與呼叫位址複製
- ✅ 右側編輯面板新增/編輯/刪除、JSON／XML 格式化
- ✅ 啟用/停用（確認框，成功 toast 可復原）

### 🔄 WSDL 轉換 (`/wsdl`)
- ✅ 支援 WSDL 網址（送出 `wsdlUrl`）或檔案上傳 (.wsdl, .xml)
- ✅ 選填 Package 名稱
- ✅ 轉換並下載 `generated_wsdl_object.zip`，失敗時保留輸入並可再試一次

## 🛠 技術架構

### 核心技術棧
- **框架**: Next.js 15.5.4 (with Turbopack)
- **UI 元件庫**: Material-UI with 明亮版主題（`src/theme/light.ts`）
- **語言**: TypeScript
- **狀態管理**: React Hooks
- **HTTP 客戶端**: Axios
- **路由**: Next.js App Router

### 明亮版設計
- **色彩**: 頁面底色 `#f5f7fa`、白底卡片、主色 `#2563eb`；狀態用綠（啟用）、灰（停用）、琥珀（未上傳）、紅（刪除）
- **字型**: Inter、Noto Sans TC，等寬 JetBrains Mono；不載入外部字型，未安裝時退回 system-ui
- **回饋**: 自訂確認框與右下角 toast，不使用瀏覽器 alert／confirm

## ⚙️ 環境設定

### 環境變數檔案層級 (優先級由高到低)
1. `.env.local` - 本地覆蓋 (所有環境，應該被 git 忽略)
2. `.env.development` - 開發環境
3. `.env.production` - 生產環境
4. `.env` - 預設值 (所有環境)

### 必要環境變數
- `NODE_ENV`: Node.js 環境 (development/production)
- `NEXT_PUBLIC_APP_ENV`: 應用程式環境標識
- `BACKEND_API_URL`: 後端 API 基礎 URL (供 API Routes 使用)
- `NEXT_PUBLIC_API_URL`: 前端 API URL (客戶端使用)

### 環境配置範例

| 環境 | 後端 URL | 說明 |
|------|----------|------|
| 開發 | `http://localhost:8080` | 本地後端服務 |
| 測試 | `http://test-server:8080` | 測試伺服器 |
| 生產 | `http://prod-server:8080` | 生產伺服器 |

## 🚀 快速開始

### 1. 安裝依賴
```bash
npm install
```

### 2. 建立本地設定檔
```bash
cp .env.local.example .env.local
```

### 3. 根據你的環境修改 `.env.local`
```env
# 本地開發設定
BACKEND_API_URL=http://localhost:8080
NEXT_PUBLIC_DEBUG_MODE=true
```

### 4. 啟動開發服務器
```bash
npm run dev
```

開啟 [http://localhost:3000](http://localhost:3000) 查看應用程式。

## 📁 專案結構

```
src/
├── app/
│   ├── endpoint/         # SOAP Endpoint 清單
│   ├── restful/          # RESTful API 清單
│   ├── response/         # Mock 回應（右側編輯面板）
│   ├── wsdl/             # WSDL 轉換
│   ├── about/            # 系統資訊
│   ├── test-api/         # 舊測試頁（不在側欄）
│   ├── layout.tsx        # 根版面：Providers + 全站外框
│   ├── page.tsx          # 首頁（導向 /endpoint）
│   └── globals.css       # 全局樣式
├── components/
│   ├── Providers.tsx     # 明亮版主題、確認框、toast、服務摘要
│   ├── shell/            # 側欄、頂列麵包屑、導覽定義
│   ├── feedback/         # 確認框、toast、載入中／無資料／錯誤狀態
│   ├── service-list/     # 清單頁共用元件與啟停、刪除流程
│   └── response/         # Mock 回應編輯面板
├── utils/                # 呼叫位址組法、JSON／XML 格式化
├── services/
│   ├── api.ts            # API 基礎配置
│   ├── endpoint.service.ts  # Endpoint API 服務
│   ├── response.service.ts  # Response API 服務
│   └── restful.service.ts   # Restful API 服務
├── forms/
│   ├── EndpointForm.tsx  # Endpoint 新增/編輯表單
│   └── RestfulForm.tsx   # Restful 新增/編輯表單
├── theme/
│   ├── tokens.ts        # 設計 token（design/admin-light-redesign/tokens.json）
│   ├── light.ts         # 明亮版 MUI 主題
│   └── cyberpunk.ts     # 舊深色主題（未使用）
├── types/
│   ├── models.ts        # 資料模型定義
│   └── response.ts      # 回應相關類型
└── config/
    └── config.ts        # 環境設定
```

## 🔧 運行指令

### 開發模式
```bash
npm run dev              # 啟動開發服務器：http://localhost:3000
npm run dev:debug        # 開發環境 (啟用除錯)
```

### 建置與部署
```bash
npm run build            # 建置應用程式
npm run build:prod       # 生產建置
npm start                # 啟動生產服務器
npm run start:prod       # 生產啟動
```

### 程式碼品質
```bash
npm run lint             # ESLint 程式碼檢查
```

## 🌐 API 整合

### WebService Controller (`/dynamic-api/ws/`)
- `GET /getEndpoints` - 取得 Endpoint 清單
- `POST /saveWebService` - 新增 Endpoint
- `POST /updateWebService` - 更新 Endpoint
- `DELETE /removeWebService` - 刪除 Endpoint
- `GET /switchWebService` - 切換狀態
- `POST /genWsdlObj` - WSDL 轉換

### Dynamic Load Controller (`/dynamic-api/api/`)
- `GET /getControllers` - 取得 Controller 清單
- `POST /saveController` - 新增 Controller
- `POST /updateController` - 更新 Controller
- `DELETE /removeController` - 刪除 Controller
- `GET /switchController` - 切換狀態

### Common Controller (`/dynamic-api/common/`)
- `POST /uploadJarFile` - 上傳 JAR 檔案
- `POST /getResponseList` - 取得回應清單
- `POST /saveMockResponse` - 儲存 Mock Response
- `POST /updateResponse` - 更新 Response
- `DELETE /deleteResponse` - 刪除 Response
- `GET /switchResponse` - 切換 Response 狀態

## 📊 與原 Angular 版本對照

| 功能 | Angular 17 | Next.js 15 | 狀態 |
|------|------------|------------|------|
| Endpoint 管理 | ✅ | ✅ | 完成 |
| Restful 管理 | ✅ | ✅ | 完成 |
| Response 管理 | ✅ | ✅ | 完成 |
| WSDL 工具 | ✅ | ✅ | 完成 |
| 檔案上傳 | ✅ | ✅ | 完成 |
| 表單驗證 | ✅ | ✅ | 完成 |
| 響應式設計 | ✅ | ✅ | 完成 |
| 多國語系 | ✅ | ✅ | 完成 |

## 🎯 特色功能

### 現代化 UI/UX
- Material Design 風格介面
- 響應式佈局 (支援桌面與行動裝置)
- 明亮版視覺設計（左側側欄、窄螢幕換到內容上方）
- 即時回饋與狀態顯示

### 完整的表單處理
- React Hook Form 表單管理
- Yup 表單驗證
- 檔案上傳處理
- 錯誤訊息顯示

### 高效的資料管理
- 分頁顯示
- 即時搜尋過濾
- 批量操作
- 狀態管理

### 開發友善
- TypeScript 型別安全
- ESLint 程式碼檢查
- 模組化架構
- 清晰的程式碼結構

## ⚠️ 注意事項

1. **以 `NEXT_PUBLIC_` 開頭的變數** 會暴露給客戶端
2. **不以此開頭的變數** 只在伺服器端可用
3. **敏感資訊** (如 API Keys) 不應使用 `NEXT_PUBLIC_` 前綴
4. **.env.local** 檔案不應提交到版本控制

## 🔧 故障排除

### 問題：頁面顯示 404 錯誤或重定向循環

**原因**: `next.config.js` 中設定了 `output: 'export'` 和 `basePath: '/dynamic-api'`

**解決方案**: 
1. 開啟 `next.config.js` 檔案
2. 註釋掉或移除以下設定（僅開發環境）：
   ```javascript
   // output: 'export',        // ← 註釋此行
   // basePath: '/dynamic-api', // ← 註釋此行
   ```
3. 重新啟動開發服務器：`npm run dev`

**說明**: 
- `output: 'export'` 用於靜態導出，開發環境不需要
- `basePath` 用於生產部署時的路徑前綴，開發環境不需要
- 建置生產版本時再取消註釋這些設定

### 問題：API 請求失敗

**檢查清單**:
1. ✅ 後端服務是否在運行？(http://localhost:8080)
2. ✅ 環境變數 `BACKEND_API_URL` 是否正確？
3. ✅ 是否有防火牆或代理阻擋請求？
4. ✅ 檢查瀏覽器控制台的錯誤訊息

### 問題：無法啟動開發服務器

**解決步驟**:
```bash
# 1. 刪除 node_modules 和 lock 檔案
rm -rf node_modules package-lock.json

# 2. 清除 Next.js 快取
rm -rf .next

# 3. 重新安裝依賴
npm install

# 4. 啟動開發服務器
npm run dev
```

## 📈 建置結果

✅ **建置成功** - 所有組件和頁面都可以正常編譯  
✅ **型別檢查通過** - TypeScript 型別檢查無錯誤  
✅ **ESLint 檢查通過** - 程式碼風格符合標準  
✅ **開發服務器可運行** - http://localhost:3000

## 🔮 未來擴展

1. **性能優化** - 添加更多快取策略
2. **測試覆蓋** - 增加單元測試和集成測試
3. **國際化** - 多語言支援
4. **主題切換** - 支援多種視覺主題
5. **實時更新** - WebSocket 支援
6. **檔案管理** - 更好的檔案上傳和管理功能

---

**專案完成度**: ~95%  
**預計完成時間**: 已完成核心功能，可投入使用  
**維護狀態**: 積極維護中

**專案維護者**: Development Team  
**創建日期**: 2024年  
**技術支援**: Next.js + Material-UI + TypeScript
