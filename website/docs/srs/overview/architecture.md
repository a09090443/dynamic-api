---
sidebar_position: 4
---

# 高階系統架構

本章節描述系統的高階架構，僅包含邏輯組成與互動關係，不含過多技術細節（技術細節請參閱 [SDD](../../sdd/intro)）。

## 邏輯架構圖

```
┌─────────────────────────────────────────────────────────┐
│                    前端管理介面                          │
│         (Next.js - Endpoint/Restful/Response 管理)       │
└────────────────────┬────────────────────────────────────┘
                     │ HTTP API
┌────────────────────┴────────────────────────────────────┐
│                    後端 API 層                           │
│   (WebServiceController, DynamicLoadController, etc.)   │
└────────────────────┬────────────────────────────────────┘
                     │
         ┌───────────┴───────────┐
         │                       │
┌────────┴────────┐   ┌─────────┴──────────┐
│  動態載入服務   │   │   Mock 回應服務    │
│ (DynamicWebSvc) │   │  (CommonService)   │
│ (DynamicCtrlSvc)│   │                    │
└────────┬────────┘   └─────────┬──────────┘
         │                      │
         │          ┌───────────┴──────────┐
         │          │                      │
┌────────┴──────────┴───┐      ┌──────────┴──────────┐
│   ClassLoader 管理     │      │   資料持久化層      │
│ (DynamicClassLoader)   │      │ (JPA + JDBC)        │
└────────────────────────┘      └──────────┬──────────┘
                                           │
                                ┌──────────┴──────────┐
                                │   SQLite 資料庫     │
                                │ (JAR/Endpoint/Ctrl/ │
                                │  MockResponse)      │
                                └─────────────────────┘
```

---

## 系統組成說明

### 1. 前端管理介面

**職責**：
- 提供視覺化的管理介面
- 處理使用者輸入與驗證
- 呼叫後端 API

**主要功能**：
- Endpoint 管理（新增、編輯、刪除、啟用/停用）
- Restful 管理（新增、編輯、刪除、啟用/停用）
- Response 管理（新增、編輯、刪除、啟用/停用）
- JAR 檔案上傳

**技術概述**：使用 Next.js 框架與 Material-UI 元件庫

---

### 2. 後端 API 層

**職責**：
- 接收前端 HTTP 請求
- 驗證請求參數
- 呼叫業務邏輯層
- 返回統一格式的回應

**主要 API 類別**：
- `WebServiceController`：Endpoint 管理 API
- `DynamicLoadController`：Restful 管理 API
- `CommonController`：JAR 與 Response 管理 API

---

### 3. 動態載入服務

**職責**：
- 從資料庫讀取 JAR 檔案
- 使用 ClassLoader 動態載入類別
- 發布 Web Service 或註冊 RESTful Controller
- 管理服務生命週期（啟用/停用）

**關鍵元件**：
- `DynamicWebServiceImpl`：Endpoint 動態載入邏輯
- `DynamicControllerServiceImpl`：Restful 動態載入邏輯
- `DynamicClassLoader`：自訂類別載入器
- `WebServiceHandler`：Web Service 生命週期管理

---

### 4. Mock 回應服務

**職責**：
- 管理 Mock 回應規則
- 提供回應查詢介面給動態載入的服務使用
- 處理回應內容的格式轉換

**關鍵元件**：
- `CommonServiceImpl`：Mock 回應管理邏輯
- `MockResponseDao`：Mock 回應資料存取
- `WebserviceBase` / `RestfulBase`：提供給自訂 JAR 繼承的基礎類別

---

### 5. 資料持久化層

**職責**：
- 儲存與查詢資料
- 管理資料一致性
- 處理交易

**資料實體**：
- JAR File：儲存 JAR 二進制內容與狀態
- Endpoint：WSDL Web Service 配置
- Controller：RESTful API 配置
- Mock Response：Mock 回應規則

---

### 6. SQLite 資料庫

**職責**：
- 持久化儲存所有配置與 JAR 檔案
- 提供查詢與交易支援

**特性**：
- 嵌入式資料庫，無需獨立伺服器
- 單一檔案儲存，方便備份與移植

---

## 互動流程

### 流程 1：部署新的 Endpoint

```
使用者 → 前端介面 → 後端 API → 動態載入服務
                                    ↓
                                讀取 JAR
                                    ↓
                                資料庫
                                    ↓
                             ClassLoader 載入
                                    ↓
                             CXF 發布服務
                                    ↓
                             更新狀態 → 資料庫
```

### 流程 2：呼叫動態載入的 Web Service

```
外部系統 → Web Service → 動態載入的類別
                               ↓
                         查詢 Mock 回應
                               ↓
                          資料庫
                               ↓
                         返回回應內容
                               ↓
                     序列化為 SOAP 回應
                               ↓
                         外部系統
```

---

## 系統邊界

### 系統內部

- 前端管理介面
- 後端 API 服務
- 動態載入引擎
- SQLite 資料庫

### 系統外部

- **外部系統**：呼叫動態載入的 Web Service 或 RESTful API
- **開發人員電腦**：開發與打包 JAR 檔案
- **瀏覽器**：訪問前端管理介面

---

## 部署視圖

### 開發模式

```
┌─────────────────────┐       ┌─────────────────────┐
│  Next.js Dev Server │◄─────►│  Spring Boot        │
│  localhost:3000     │ CORS  │  localhost:8080     │
└─────────────────────┘       └──────────┬──────────┘
                                         │
                              ┌──────────▼──────────┐
                              │  SQLite Database    │
                              │  (embedded)         │
                              └─────────────────────┘
```

### 生產模式

```
┌─────────────────────────────────────────┐
│     Spring Boot Embedded JAR            │
│     localhost:8080                      │
│                                         │
│  ┌────────────────────────────┐        │
│  │  Next.js Static Files      │        │
│  │  (built-in)                │        │
│  └────────────────────────────┘        │
│                                         │
│  ┌────────────────────────────┐        │
│  │  Spring Boot Application   │        │
│  └────────────────────────────┘        │
└────────────────┬────────────────────────┘
                 │
      ┌──────────▼──────────┐
      │  SQLite Database    │
      │  (database/)        │
      └─────────────────────┘
```

---

## 擴展性考量

### 水平擴展

目前架構為單機部署，未來若需水平擴展，需考慮：

- **資料庫分離**：將 SQLite 替換為 PostgreSQL/MySQL
- **狀態同步**：多節點間的 ClassLoader 狀態同步
- **負載平衡**：使用 Nginx 或 HAProxy 分配請求

### 功能擴展

架構預留以下擴展空間：

- **新增協定支援**：GraphQL、gRPC（需擴展動態載入機制）
- **認證授權**：整合 OAuth2 或 JWT Token
- **監控與追蹤**：整合 Prometheus、Grafana、Zipkin

---

## 技術限制

### 目前限制

1. **單機部署**：不支援叢集部署
2. **同步處理**：JAR 載入為同步操作，可能阻塞請求
3. **記憶體限制**：每個 JAR 佔用 JVM 記憶體
4. **SQLite 並發**：寫入並發能力有限

### 未來改進方向

1. **非同步載入**：使用訊息佇列處理 JAR 載入
2. **記憶體優化**：實作 ClassLoader 自動回收機制
3. **資料庫升級**：支援 PostgreSQL/MySQL
4. **分散式部署**：支援多節點部署

---

## 相關文件

- [系統目標](./goals) - 了解架構要達成的目標
- [主要使用情境](./use-cases) - 了解架構如何支援使用情境
- [SDD - 系統總體設計](../../sdd/architecture/overview) - 詳細的技術架構設計
