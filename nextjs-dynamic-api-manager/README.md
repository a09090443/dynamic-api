# Dynamic API Tech Manager

[![Next.js](https://img.shields.io/badge/Next.js-15.5.4-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Latest-blue)](https://www.typescriptlang.org/)
[![Material-UI](https://img.shields.io/badge/Material--UI-Latest-0081CB)](https://mui.com/)

一個基於 Next.js 的科技風格動態 API 管理系統，替代原版 Angular 應用程式。

## 🚀 專案概述

本專案是一個現代化的 Web 應用程式，用於管理動態 API 服務，包括 Endpoint 和 Restful 服務的管理，以及相應的回應內容設定。採用科技風格的 UI 設計，提供直觀且高效的管理介面。

## ✨ 主要功能

### 🔧 Endpoint 管理 (`/endpoint`)
- ✅ 顯示 Endpoint 清單
- ✅ 新增/編輯/刪除 Endpoint
- ✅ 批量刪除功能
- ✅ 啟用/停用狀態切換（含確認對話框）
- ✅ JAR 檔案上傳功能
- ✅ WSDL 物件轉換
- ✅ 搜尋過濾與分頁顯示

### 🌐 Restful 管理 (`/restful`)
- ✅ 顯示 Restful Controller 清單
- ✅ 新增/編輯/刪除 Restful Controller
- ✅ 批量刪除功能
- ✅ 啟用/停用狀態切換（含確認對話框）
- ✅ JAR 檔案上傳功能
- ✅ 搜尋過濾與分頁顯示

### 📝 回應管理 (`/response`)
- ✅ 顯示 Response 清單
- ✅ 新增/編輯/刪除 Response
- ✅ 批量刪除功能（含確認對話框）
- ✅ 啟用/停用狀態切換（含確認對話框）
- ✅ 內容預覽（長文本展開功能）
- ✅ 搜尋過濾與分頁顯示

### 🔄 WSDL 轉換工具
- ✅ 支援 WSDL URL 輸入
- ✅ 支援檔案上傳 (.wsdl, .xml)
- ✅ 執行轉換並下載結果

## 🛠 技術架構

### 核心技術棧
- **框架**: Next.js 15.5.4 (with Turbopack)
- **UI 元件庫**: Material-UI with 自定義科技風主題
- **語言**: TypeScript
- **樣式**: CSS 模組化 + 科技風全局樣式
- **狀態管理**: React Hooks
- **HTTP 客戶端**: Axios
- **路由**: Next.js App Router

### 科技風設計特色
- **主色調**: 螢光綠 (#00e676)、青藍色 (#00bcd4)、橙色 (#ff6d00)
- **視覺效果**: 格網背景、螢光效果、動畫效果、毛玻璃透明度
- **UI 組件**: 漸層背景、螢光邊框、懸停效果

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

開啟 [http://localhost:3001](http://localhost:3001) 查看應用程式。

## 📁 專案結構

```
src/
├── app/
│   ├── endpoint/         # Endpoint 管理頁面
│   ├── restful/          # Restful 管理頁面
│   ├── response/         # 回應管理頁面
│   ├── about/            # 關於頁面
│   ├── api/              # API 代理路由
│   ├── layout.tsx        # 主佈局
│   ├── page.tsx          # 首頁
│   └── globals.css       # 全局樣式
├── components/
│   └── Header.tsx        # 頂部導航元件
├── services/
│   ├── api.ts            # API 基礎配置
│   ├── endpoint.service.ts  # Endpoint API 服務
│   ├── response.service.ts  # Response API 服務
│   └── restful.service.ts   # Restful API 服務
├── forms/
│   ├── EndpointForm.tsx  # Endpoint 新增/編輯表單
│   └── RestfulForm.tsx   # Restful 新增/編輯表單
├── dialogs/
│   └── WsdlGenObjDialog.tsx # WSDL 物件轉換對話框
├── theme/
│   ├── tech.ts          # 科技風主題配置
│   └── cyberpunk.ts     # 賽博朋克主題（備用）
├── types/
│   ├── models.ts        # 資料模型定義
│   └── response.ts      # 回應相關類型
└── config/
    └── config.ts        # 環境設定
```

## 🔧 運行指令

### 開發模式
```bash
npm run dev              # 啟動開發服務器：http://localhost:3001
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
- 科技風視覺設計
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

## 📈 建置結果

✅ **建置成功** - 所有組件和頁面都可以正常編譯  
✅ **型別檢查通過** - TypeScript 型別檢查無錯誤  
✅ **ESLint 檢查通過** - 程式碼風格符合標準  
✅ **開發服務器可運行** - http://localhost:3001

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
