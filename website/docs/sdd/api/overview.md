---
sidebar_position: 1
---

# API 設計概述

本章節說明系統 API 的整體設計原則與規範。

---

## 協定與格式

### RESTful HTTP

所有管理 API 遵循 RESTful 風格設計。

| 項目 | 規範 |
|------|------|
| **協定** | HTTP/HTTPS |
| **Content-Type** | `application/json` |
| **編碼** | UTF-8 |
| **Base URL（開發）** | `http://localhost:8080/dynamic-api` |
| **Base URL（生產）** | `http://[host]:[port]/dynamic-api` |

---

## 認證方式

<!-- TODO: 初版未實作認證，後續可考慮以下方案 -->

### 候選認證方案

| 方案 | 適用場景 | 優點 | 缺點 |
|------|---------|------|------|
| **HTTP Basic Authentication** | 內部系統 | 簡單易實作 | 需搭配 HTTPS |
| **JWT Token** | 前後端分離 | 無狀態 | 需實作 Token 刷新 |
| **API Key** | 系統間整合 | 易於管理 | 需實作 Key 管理介面 |

---

## 統一回應格式

### 成功回應

```json
{
  "success": true,
  "data": {
    // 資料內容
  },
  "message": "操作成功"
}
```

### 錯誤回應

```json
{
  "success": false,
  "error": {
    "code": "PUBLISH_URI_EXISTS",
    "message": "Publish URI 已存在"
  },
  "timestamp": "2026-01-02T10:30:00Z"
}
```

---

## 統一錯誤碼

| 錯誤碼 | HTTP 狀態碼 | 說明 |
|--------|------------|------|
| `INVALID_REQUEST` | 400 | 請求參數無效 |
| `UNAUTHORIZED` | 401 | 未認證 |
| `FORBIDDEN` | 403 | 無權限 |
| `NOT_FOUND` | 404 | 資源不存在 |
| `PUBLISH_URI_EXISTS` | 409 | Publish URI 已存在 |
| `BEAN_NAME_EXISTS` | 409 | Bean Name 已存在 |
| `JAR_FILE_NOT_FOUND` | 404 | JAR 檔案不存在 |
| `CLASS_NOT_FOUND` | 404 | 類別不存在於 JAR 中 |
| `ENDPOINT_NOT_FOUND` | 404 | Endpoint 不存在 |
| `CONTROLLER_NOT_FOUND` | 404 | Controller 不存在 |
| `JAR_IN_USE` | 409 | JAR 檔案使用中，無法刪除 |
| `ENDPOINT_ACTIVE` | 409 | Endpoint 啟用中，無法刪除 |
| `LOAD_FAILED` | 500 | 類別載入失敗 |
| `PUBLISH_FAILED` | 500 | 服務發布失敗 |
| `INTERNAL_ERROR` | 500 | 系統內部錯誤 |

---

## API 分類

```mermaid
graph TD
    A[Dynamic API] --> B[Endpoint 管理 API]
    A --> C[Restful 管理 API]
    A --> D[共用功能 API]

    B --> B1[/ws/*]
    C --> C1[/api/*]
    D --> D1[/common/*]
```

### API 模組分類

| 模組 | 路徑前綴 | 功能 |
|------|---------|------|
| **Endpoint 管理** | `/dynamic-api/ws/` | WSDL Web Service 管理 |
| **Restful 管理** | `/dynamic-api/api/` | RESTful API 管理 |
| **共用功能** | `/dynamic-api/common/` | JAR 上傳、Mock 回應管理 |

---

## API 命名規範

### 動詞使用

| HTTP Method | 用途 | 範例 |
|-------------|------|------|
| **GET** | 查詢資源 | `GET /getEndpoints` |
| **POST** | 建立資源 | `POST /saveWebService` |
| **PUT** | 更新資源 | `PUT /updateWebService` |
| **DELETE** | 刪除資源 | `DELETE /removeWebService` |

:::note 命名風格
本系統使用動詞風格端點命名（如：`/saveWebService`），而非純 RESTful 風格（如：`/web-services`）
:::

---

## 版本控制策略

<!-- TODO: 未來可考慮 API 版本控制 -->

### 候選方案

1. **URL 版本控制**：`/api/v1/endpoints`
2. **Header 版本控制**：`Accept: application/vnd.api.v1+json`
3. **參數版本控制**：`/api/endpoints?version=1`

---

## CORS 配置

### 允許來源

| 環境 | 允許來源 |
|------|---------|
| **開發模式** | `http://localhost:3000` |
| **生產模式** | 同源（無需 CORS） |

### 允許方法

```
GET, POST, PUT, DELETE, OPTIONS, PATCH
```

### 允許 Header

```
Content-Type, Authorization, X-Requested-With
```

---

## API 文件化

:::tip Swagger/OpenAPI
建議整合 Springdoc OpenAPI，提供互動式 API 文件：
- 訪問路徑：`/swagger-ui.html`
- OpenAPI Spec：`/v3/api-docs`
:::

---

## 參考資源

- RESTful API 設計指南：https://restfulapi.net/
- OpenAPI Specification：https://swagger.io/specification/
- HTTP 狀態碼：https://developer.mozilla.org/zh-TW/docs/Web/HTTP/Status
