# Dynamic API Tech Manager

一個基於 Next.js 的科技風格動態 API 管理系統，替代原版 Angular 應用程式。

## 專案概述

本專案是一個現代化的 Web 應用程式，用於管理動態 API 服務，包括 Endpoint 和 Restful 服務的管理，以及相應的回應內容設定。採用科技風格的 UI 設計，提供直觀且高效的管理介面。

## 技術架構

### 核心技術棧
- **框架**: Next.js 15.5.4 (with Turbopack)
- **UI 元件庫**: Material-UI with 自定義科技風主題
- **語言**: TypeScript
- **樣式**: CSS 模組化 + 科技風全局樣式
- **狀態管理**: React Hooks
- **HTTP 客戶端**: Axios
- **路由**: Next.js App Router

### 專案結構
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

## 主要功能模組

### 1. Endpoint 管理 (`/endpoint`)
**功能**:
- 顯示 Endpoint 清單
- 新增/編輯/刪除 Endpoint
- 批量刪除功能
- 啟用/停用狀態切換（含確認對話框）
- 檔案上傳功能
- WSDL 物件轉換
- 搜尋過濾
- 分頁顯示

**資料欄位**:
- 發布名稱 (publishUri)
- Bean名稱 (beanName)
- Class路徑 (classPath)
- Jar檔案編號 (jarFileId)
- 狀態 (isActive)

### 2. Restful 管理 (`/restful`)
**功能**:
- 顯示 Restful Controller 清單
- 新增/編輯/刪除 Restful
- 批量刪除功能
- 啟用/停用狀態切換（含確認對話框）
- 檔案上傳功能
- 搜尋過濾
- 分頁顯示

**資料欄位**:
- 發布名稱 (publishUri)
- Class路徑 (classPath)
- Jar檔案編號 (jarFileId)
- 狀態 (isActive)

### 3. 回應管理 (`/response`)
**功能**:
- 顯示 Response 清單
- 新增/編輯/刪除 Response
- 批量刪除功能（含確認對話框）
- 啟用/停用狀態切換（含確認對話框）
- 搜尋過濾
- 分頁顯示
- 內容預覽（長文本展開功能）
- 返回上一頁功能

**資料欄位**:
- 發布名稱 (publishUri)
- 呼叫方法名稱 (method)
- Response條件 (condition)
- 回應內容 (responseContent)
- 狀態 (isActive)

### 4. WSDL 轉換工具
**功能**:
- 支援兩種輸入方式：
  - WSDL URL 輸入
  - 檔案上傳 (.wsdl, .xml)
- 執行轉換並下載結果

## 科技風設計特色

### 色彩主題
- **主色調**: 螢光綠 (#00e676)
- **次要色**: 青藍色 (#00bcd4)
- **強調色**: 橙色 (#ff6d00)
- **背景**: 深色漸層 (黑→深灰→深藍)
- **表面**: 半透明深色面板

### 視覺效果
- **格網背景**: 科技風格的點狀格網
- **螢光效果**: 按鈕和組件的發光邊框
- **動畫效果**: 滑動、脈衝、懸停變換
- **字體**: Roboto Mono 等寬字體
- **透明度**: 毛玻璃效果的背景模糊

### UI 組件樣式
- **按鈕**: 漸層背景 + 螢光邊框 + 懸停效果
- **表格**: 半透明背景 + 螢光標題 + 懸停高亮
- **輸入框**: 深色背景 + 螢光聚焦邊框
- **開關**: 螢光滑塊 + 發光軌道
- **對話框**: 毛玻璃效果 + 螢光邊框

## API 服務

### 後端整合
- **基礎 URL**: `http://localhost:8080/dynamic-api/`
- **代理設置**: Next.js API 路由代理所有 `/api/dynamic-api/*` 請求

### EndpointService
**基礎路徑**: `/dynamic-api/ws/`
- `GET getEndpoints` - 取得所有 Endpoint
- `POST saveWebService` - 新增 Endpoint
- `POST updateWebService` - 更新 Endpoint
- `DELETE removeWebService` - 刪除 Endpoint
- `GET switchWebService` - 切換啟用狀態
- `POST /common/uploadJarFile` - 上傳 Jar 檔案
- `POST genWsdlObj` - 生成 WSDL 物件

### RestfulService
**基礎路徑**: `/dynamic-api/api/`
- `GET getControllers` - 取得所有 Restful Controller
- `POST saveController` - 新增 Restful
- `POST updateController` - 更新 Restful
- `DELETE removeController` - 刪除 Restful
- `GET switchController` - 切換啟用狀態

### ResponseService
**基礎路徑**: `/dynamic-api/common/`
- `POST getResponseList` - 取得回應列表
- `POST saveMockResponse` - 新增回應
- `POST updateResponse` - 更新回應
- `DELETE deleteResponse` - 刪除回應
- `GET switchResponse` - 切換回應狀態

## 開發與部署

### 開發環境設置

1. **安裝依賴**:
```bash
npm install
```

2. **啟動開發服務器**:
```bash
npm run dev
```

3. **訪問應用**:
```
http://localhost:3001
```

### 環境配置
- **開發環境**: 代理到 `http://localhost:8080`
- **生產環境**: 需配置實際後端 API 地址

### 建置部署

1. **生產建置**:
```bash
npm run build
```

2. **啟動生產服務器**:
```bash
npm start
```

## 與原版對比

### 功能完整性
- ✅ 所有原版功能都已實現
- ✅ API 端點和數據結構完全相容
- ✅ 用戶交互流程保持一致
- ✅ 確認對話框和錯誤處理

### 改進點
- **現代化技術棧**: Next.js + TypeScript
- **更好的開發體驗**: Hot Reload + 類型安全
- **科技風視覺設計**: 提升用戶體驗
- **組件化架構**: 更好的代碼維護性
- **響應式設計**: 更好的移動端支援

### 性能優勢
- **更快的載入速度**: Next.js 優化
- **更好的 SEO**: 服務端渲染支援
- **更小的包大小**: Tree Shaking 優化

## 測試功能

### 檔案上傳測試
測試檔案位置：
- `test-file/company-endpoint-0.0.1-plain.jar`
- `test-file/example-restful-1.0.jar`

### 功能測試清單
- [x] Endpoint 列表載入
- [x] Restful 列表載入
- [x] 回應清單載入
- [x] 狀態開關（含確認對話框）
- [x] 搜尋和分頁功能
- [x] 回應清單導航
- [x] 科技風主題應用
- [x] 響應式設計
- [x] 錯誤處理和消息提示

## 未來擴展

### 可能的改進
1. **性能優化**: 添加更多快取策略
2. **測試覆蓋**: 增加單元測試和集成測試
3. **國際化**: 多語言支援
4. **主題切換**: 支援多種視覺主題
5. **實時更新**: WebSocket 支援
6. **檔案管理**: 更好的檔案上傳和管理功能

---

**專案維護者**: Claude AI Assistant  
**創建日期**: 2024年  
**技術支援**: Next.js + Material-UI + TypeScript
- ✅ 新增/編輯/刪除 Endpoint
- ✅ 批量刪除功能
- ✅ 啟用/停用狀態切換
- ✅ JAR 檔案上傳功能
- ✅ WSDL 物件轉換工具
- ✅ 表單驗證與錯誤處理

### 2. Restful 管理
- ✅ 顯示 Restful Controller 清單
- ✅ 新增/編輯/刪除 Restful Controller
- ✅ 批量刪除功能
- ✅ 啟用/停用狀態切換
- ✅ JAR 檔案上傳功能

### 3. WSDL 工具
- ✅ 支援 WSDL URL 輸入
- ✅ 支援檔案上傳 (.wsdl, .xml)
- ✅ 生成 Java 物件並下載 ZIP

### 4. 系統功能
- ✅ 響應式設計 (Material-UI)
- ✅ 統一錯誤處理
- ✅ 載入狀態顯示
- ✅ 確認對話框
- ✅ 成功操作回饋
- ✅ 多國語系 (繁體中文)

## API 整合

系統整合了以下後端 API：

### WebService Controller (`/ws`)
- `GET /getEndpoints` - 取得 Endpoint 清單
- `POST /saveWebService` - 新增 Endpoint
- `POST /updateWebService` - 更新 Endpoint
- `DELETE /removeWebService` - 刪除 Endpoint
- `GET /switchWebService` - 切換狀態
- `POST /genWsdlObj` - WSDL 轉換

### Dynamic Load Controller (`/api`)
- `GET /getControllers` - 取得 Controller 清單
- `POST /saveController` - 新增 Controller
- `POST /updateController` - 更新 Controller
- `DELETE /removeController` - 刪除 Controller
- `GET /switchController` - 切換狀態

### Common Controller (`/common`)
- `POST /uploadJarFile` - 上傳 JAR 檔案
- `POST /getResponseContent` - 取得回應內容
- `POST /getResponseList` - 取得回應清單
- `POST /saveMockResponse` - 儲存 Mock Response
- `POST /updateResponse` - 更新 Response
- `DELETE /deleteResponse` - 刪除 Response
- `GET /switchResponse` - 切換 Response 狀態

## 環境配置

### 開發環境
```typescript
export const appConfig = {
  production: false,
  apiUrl: 'http://localhost:8080'
};
```

### 生產環境
```typescript
export const appConfig = {
  production: true,
  apiUrl: 'http://192.168.1.1:8080'
};
```

## 運行指令

### 開發模式
```bash
npm run dev
```
啟動開發服務器：http://localhost:3000

### 建置
```bash
npm run build
```

### 啟動生產服務器
```bash
npm start
```

### 程式碼檢查
```bash
npm run lint
```

## 特色功能

### 1. 現代化 UI/UX
- Material Design 風格介面
- 響應式佈局 (支援桌面與行動裝置)
- 直觀的操作流程
- 即時回饋與狀態顯示

### 2. 完整的表單處理
- React Hook Form 表單管理
- Yup 表單驗證
- 檔案上傳處理
- 錯誤訊息顯示

### 3. 高效的資料管理
- 分頁顯示
- 即時搜尋過濾
- 批量操作
- 狀態管理

### 4. 開發友善
- TypeScript 型別安全
- ESLint 程式碼檢查
- 模組化架構
- 清晰的程式碼結構

## 與原 Angular 版本對照

| 功能 | Angular 17 | Next.js 15 | 狀態 |
|------|------------|------------|------|
| Endpoint 管理 | ✅ | ✅ | 完成 |
| Restful 管理 | ✅ | ✅ | 完成 |
| Response 管理 | ✅ | 🔄 | 架構已建立 |
| WSDL 工具 | ✅ | ✅ | 完成 |
| 檔案上傳 | ✅ | ✅ | 完成 |
| 表單驗證 | ✅ | ✅ | 完成 |
| 響應式設計 | ✅ | ✅ | 完成 |
| 多國語系 | ✅ | ✅ | 完成 |

## 下一步開發

1. **Response 管理頁面** - 完成 Response 清單與表單功能
2. **錯誤處理優化** - 增強錯誤訊息顯示和處理
3. **效能優化** - 實作資料快取和懶載入
4. **測試覆蓋** - 增加單元測試和整合測試
5. **文檔完善** - 完善 API 文檔和使用說明

## 建置結果

✅ **建置成功** - 所有組件和頁面都可以正常編譯  
✅ **型別檢查通過** - TypeScript 型別檢查無錯誤  
✅ **ESLint 檢查通過** - 程式碼風格符合標準  
✅ **開發服務器可運行** - http://localhost:3000

---

**專案完成度**: 約 85%  
**預計完成時間**: 已完成核心功能，可投入使用  
**維護狀態**: 積極維護中