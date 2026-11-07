---
id: conventions
title: 5.1 管理 API 概述與慣例
description: '管理 API 的端點分組、共通慣例、{code, message, data} 回應格式（驗證失敗為 HTTP 200 + code=400），以及 Postman 範例集合。'
sidebar_label: 5.1 概述與慣例
---

# 5.1 管理 API 概述與慣例

## 端點分組

| 前綴 | Controller | 用途 | 規格 |
|---|---|---|---|
| `/dynamic-api/ws` | `WebServiceController` | Endpoint（SOAP）管理、WSDL 轉換 | [5.2 Endpoint API](./endpoint.md) |
| `/dynamic-api/api` | `DynamicLoadController` | RESTful 管理 | [5.3 RESTful API](./restful.md) |
| `/dynamic-api/common` | `CommonController` | JAR 上傳、Mock 回應、日誌串流 | [5.4 共用 API](./common.md) |

另有兩類非管理 API 的端點：

| 路徑 | 說明 |
|---|---|
| `/dynamic-api/webservice/{publishUri}` | 動態發布的 SOAP 服務（CXF） |
| `/dynamic-api/{publishUri}/...` | 動態註冊的 RESTful 服務 |

## 共通慣例

| 項目 | 慣例 |
|---|---|
| Base URL | `http://{host}:8080/dynamic-api` |
| 認證 | 無 |
| Content-Type | 請求 `application/json`（上傳為 `multipart/form-data`）；回應 `application/json` |
| 命名 | 動詞式路徑（`getEndpoints`、`saveWebService`），非 RESTful 資源風格 |
| HTTP 方法 | 查詢與切換用 `GET`，新增與修改用 `POST`，刪除用 `DELETE`（本文為 JSON 陣列） |
| 識別碼 | Endpoint / RESTful 以 `publishUri` 操作（`update` 例外，使用 `id`）；Mock 回應以 `id` 操作 |

## 回應格式

三個管理 Controller 標註 `@ResponseResultBody`，回傳值會被包成：

```json
{
  "code": 200,
  "message": "OK",
  "data": { }
}
```

| `code` | `message` | 情況 |
|---|---|---|
| 200 | `OK` | 成功 |
| 400 | `Bad Request` | Controller 層驗證失敗（必填欄位空白、上傳檔案不合法） |
| 500 | `Internal Server Error` | 未處理的例外（由 zipe `ResponseResultBodyAdvice` 處理時） |

:::caution HTTP 狀態碼與 `code` 不一定一致
- **驗證失敗**時，HTTP 狀態碼仍是 **200**，只有本文的 `code` 是 400。呼叫端必須檢查 `code`。
- **例外**時 HTTP 狀態碼為 **500**。專案的 `GlobalExceptionHandler` 與 zipe 的 `ResponseResultBodyAdvice` 都會處理例外，前者回傳**純文字**錯誤訊息，後者回傳上述 JSON 格式；實際由哪一個處理取決於 Advice 的載入順序。呼叫端應同時容忍兩種格式。
- 部分操作會吞掉例外並回傳成功，例如 `switchResponse`。
:::

前端 `apiClient` 的處理方式可作為參考：`code` 為數字且不為 200 時視為失敗；HTTP 錯誤時取 `data.message`，沒有則用 `statusText`。

## 範例集合

`postman/Endpoints.postman_collection.json` 收錄管理 API、SOAP 與 RESTful 服務的呼叫範例，最上層依序為：

| 項目 | 內容 |
|---|---|
| `Company` | `company-endpoint` 的註冊、啟用、移除、回應 CRUD 與 SOAP 呼叫 |
| `Upload_jar_file` | 上傳 JAR（`/common/uploadJarFile`）；匯入後須在 Body 的 `file` 欄位重新選擇本機 JAR 檔 |
| `Order` | `order-endpoint` 的 WSDL 與 SOAP 呼叫 |
| `company-restful` | `POST /company/data` |
| `example-restful` | `GET /example/response`、`POST /example/data` |
| `inventory-restful` | `GET /inventory/items/A001`、`POST /inventory/items` |
| `mitake-restful` | `POST /b2c/mtk/SmSend`、`SmBulkSend`、`SmQuery`（狀態、餘額各一）、`SmCancel` |
| `Management_API` | `/api` 的 RESTful 管理、`/ws` 的 `getEndpoints`、`updateWebService`、`genWsdlObj`，以及 `/common` 的 Mock 回應管理（`saveMockResponse` 的 Endpoint／RESTful 版本、`getResponseList`、`getResponseContent`、`deleteResponse`、`switchResponse`） |

需要 id 的請求以 `REPLACE_WITH_*` 佔位字串表示，執行前換成實際值。`/common/logs/stream`（SSE）不收錄。

:::caution 舊請求缺少 serviceType
`Company` 資料夾中的 `Company_add_response` 與 `Company_get_responses` 沒有帶 `serviceType`：存入的回應 `SERVICE_TYPE` 為空，服務呼叫時查不到；查清單也只會得到空結果。請改用 `Management_API` 中的 `Common_saveMockResponse_endpoint`、`Common_saveMockResponse_restful` 與 `Common_getResponseList`。
:::

agent 之後新建的 RESTful／SOAP 服務呼叫請求也收錄在同一份集合，每個服務一個資料夾：RESTful 為每個 API 的請求，SOAP 為 WSDL 的 GET 請求與每個 operation 的 POST 請求。
