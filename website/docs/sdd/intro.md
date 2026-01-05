---
sidebar_position: 0
---

# 文件資訊

## Dynamic API Manager - 軟體設計規格書（SDD）

- **文件名稱**：Dynamic API Manager 軟體設計規格書
- **系統／專案名稱**：Dynamic API Manager
- **版本**：1.0.0
- **修訂日期**：2026-01-02
- **作者**：開發團隊
- **對應 SRS 版本**：1.0.0

---

## 快速導覽

本文件共包含以下章節：

### 2. 系統總體設計
- [架構概覽](./architecture/overview) - 架構風格、技術棧

### 3. 模組設計
- [模組概述](./modules/overview) - 模組化設計原則
- [JAR 管理](./modules/jar-module) - JAR 檔案管理模組
- [Endpoint 管理](./modules/endpoint-module) - WSDL Web Service 管理
- [Restful 管理](./modules/restful-module) - RESTful API 管理

### 4. 資料設計
- [資料模型（ERD）](./database/erd) - 實體關係圖
- [資料表 Schema](./database/schema) - 資料表定義
- [資料一致性](./database/consistency) - 交易管理

### 5. API 設計
- [API 概述](./api/overview) - API 設計原則
- [Endpoint API](./api/endpoint-api) - Web Service 管理 API
- [Restful API](./api/restful-api) - Controller 管理 API
- [Common API](./api/common-api) - 共用 API
- [錯誤處理](./api/error-handling) - 錯誤回應規範

### 6. 業務流程
- [業務流程概述](./workflows/overview) - 核心流程說明
- [Endpoint 動態載入](./workflows/endpoint-loading) - WSDL 載入流程

### 8. 部署與運維
- [部署概述](./deployment/overview) - 部署策略與環境配置

---

## 設計原則

本系統設計遵循以下原則：

### 1. 模組化與低耦合
- 分層架構：Controller → Service → Repository
- 每層職責明確，不跨層呼叫
- 模組間透過介面溝通

### 2. 可擴展性
- 支援動態載入新的 JAR 模組
- ClassLoader 隔離，避免類別衝突
- 架構設計預留擴展空間

### 3. 簡單優先
- 初版使用 SQLite 嵌入式資料庫
- 單機部署，降低運維複雜度
- 避免過度設計

### 4. 安全性考量
- 輸入驗證，防止注入攻擊
- 錯誤訊息不洩漏內部資訊
- 預留認證授權機制擴展點

### 5. 可維護性
- 完整的日誌記錄
- 統一的錯誤處理
- 清晰的程式碼結構

---

## 技術棧概覽

### 後端技術
- **語言**：Java 17+
- **框架**：Spring Boot 3.2.5
- **Web Service**：Apache CXF 4.0+
- **資料庫**：SQLite 3.x
- **ORM**：Spring Data JPA（Hibernate 6.x）
- **建置工具**：Gradle 8.7+

### 前端技術
- **語言**：TypeScript 5.x
- **框架**：Next.js 15.5.4 + React 19
- **UI 元件庫**：Material-UI (MUI) 6.x
- **HTTP Client**：Axios

---

## 對應關係

本 SDD 與 SRS 的對應關係：

| SRS 章節 | SDD 對應章節 | 說明 |
|---------|-------------|------|
| 2. 系統概述 | 2. 系統總體設計 | 需求 → 架構設計 |
| 3. 功能需求 | 3. 模組設計、5. API 設計 | 需求 → 模組與 API |
| 6. 資料與業務規則 | 4. 資料設計 | 資料需求 → 資料庫設計 |
| 4. 非功能需求 | 7. 安全性設計、8. 部署與運維 | 品質需求 → 技術設計 |

---

## 文件更新記錄

| 版本 | 日期 | 作者 | 變更摘要 |
|------|------|------|---------|
| 1.0.0 | 2026-01-02 | 開發團隊 | 初版完成 |

---

## 閱讀建議

### 對於架構師
建議閱讀順序：
1. [架構概覽](./architecture/overview)
2. [模組設計](./modules/overview)

### 對於後端開發
建議閱讀順序：
1. [模組設計](./modules/overview)
2. [資料設計](./database/schema)
3. [API 設計](./api/overview)
4. [業務流程](./workflows/endpoint-loading)

### 對於前端開發
建議閱讀順序：
1. [API 設計](./api/overview)
2. [架構概覽](./architecture/overview)

### 對於 QA 測試
建議閱讀順序：
1. [API 設計](./api/overview) - 了解 API 規格
2. [業務流程](./workflows/endpoint-loading) - 了解核心流程
3. [錯誤處理](./api/error-handling) - 了解錯誤場景

### 對於維運人員
建議閱讀順序：
1. [部署概述](./deployment/overview)
