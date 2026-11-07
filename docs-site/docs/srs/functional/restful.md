---
id: restful
title: 3.3 RESTful 管理
description: 'FR-RS-001～009 RESTful 管理需求：與 Endpoint 管理的差異、專屬規則、查詢已註冊路由與 OpenAPI／Swagger UI 文件。'
sidebar_label: 3.3 RESTful 管理
---

# 3.3 RESTful 管理

RESTful 管理的需求結構與 [Endpoint 管理](./endpoint.md) 對應，以下列出差異與專屬規則。

## FR-RS-001 新增 RESTful

| 項目 | 內容 |
|---|---|
| 觸發者 | 管理介面、`POST /api/saveController` |
| 輸入 | `publishUri`、`classPath`（必填）、`jarFileId` |
| 後置條件 | `CONTROLLER` 新增一筆，`IS_ACTIVE=0`；JAR 狀態 `A` |
| 業務規則 | `publishUri` 為主鍵；缺必填欄位回應 `code=400` |

## FR-RS-002 啟用 RESTful

| 項目 | 內容 |
|---|---|
| 描述 | 系統應載入 Controller 類別，並將其處理方法動態註冊至 Spring MVC |
| 觸發者 | 管理介面開關、`GET /api/switchController?isActive=true` |
| 業務規則 | 1. 類別需標註 `@RestController`，否則不註冊任何路由<br/>2. 類別 `@RequestMapping` 第一段必須等於 `publishUri`，否則失敗（「路徑不一致」）<br/>3. 以 Spring 建立實例並執行相依注入<br/>4. 註冊標註 `@RequestMapping`／`@GetMapping`／`@PostMapping`／`@PutMapping`／`@DeleteMapping` 的方法；路徑為「類別路徑 + 方法路徑」 |
| 驗收標準 | ✅ 範例 `CompanyController` 啟用後 `POST /dynamic-api/company/data` 可呼叫<br/>❌ Publish URI 填 `abc` 時啟用失敗 |

## FR-RS-003 停用 RESTful

| 項目 | 內容 |
|---|---|
| 觸發者 | 管理介面開關、`GET /api/switchController?isActive=false` |
| 後置條件 | 所有對應自 `RequestMappingHandlerMapping` 取消註冊；ClassLoader 關閉；`IS_ACTIVE=0`；JAR 狀態 `I` |

## FR-RS-004 編輯 RESTful

| 項目 | 內容 |
|---|---|
| 觸發者 | 管理介面、`POST /api/updateController` |
| 輸入 | `id`、`publishUri`、`classPath`、`jarFileId`（皆必填） |
| 業務規則 | 同 FR-EP-004：先停用、儲存為停用、Publish URI 變更時搬移 Mock 回應 |

## FR-RS-005 刪除 RESTful

| 項目 | 內容 |
|---|---|
| 觸發者 | 管理介面、`DELETE /api/removeController`（本文為 Publish URI 陣列） |
| 業務規則 | 同 FR-EP-005 |

## FR-RS-006 查詢 RESTful 清單

| 項目 | 內容 |
|---|---|
| 觸發者 | 管理介面、`GET /api/getControllers` |
| 輸出 | `id`、`publishUri`、`classPath`、`isActive`、`jarFileId`、`jarFileName` |

## FR-RS-007 啟動時恢復 RESTful

| 項目 | 內容 |
|---|---|
| 描述 | 應用程式啟動時，系統應自動註冊所有 `IS_ACTIVE=1` 的 RESTful |
| 業務規則 | 單筆失敗不影響其他筆；失敗者改為停用 |

## FR-RS-008 查詢已註冊路由

| 項目 | 內容 |
|---|---|
| 描述 | 系統應能列出已啟用 RESTful 實際註冊的路由，便於除錯 |
| 現況 | Actuator 端點 `show-mappings` 已實作，但未列入 `management.endpoints.web.exposure.include`（設定值為 `custom-api-mappings`），無法透過 HTTP 存取（KI-04） |

## FR-RS-009 RESTful 服務的 OpenAPI 文件與 Swagger UI

| 項目 | 內容 |
|---|---|
| 描述 | 系統應為已啟用的 RESTful 服務提供 OpenAPI 3 文件，並以 Swagger UI 瀏覽 |
| 觸發者 | `GET /dynamic-api/api/getOpenApi`；瀏覽器開啟 `/dynamic-api/swagger-ui.html` |
| 輸出 | OpenAPI 3.0.3 JSON（最外層即 `openapi` 物件，不包 `{code, message, data}`），標頭 `Cache-Control: no-store` |
| 業務規則 | 1. 每次請求即時產生、不快取；啟用、停用或重新上傳後下一次請求即反映，不需重啟<br/>2. 只列出 `IS_ACTIVE=1`、且由該服務 ClassLoader 實際註冊在 `RequestMappingHandlerMapping` 的路由<br/>3. 以 `publishUri` 為 tag，`operationId` 不重複；`@PathVariable`／`@RequestParam`／`@RequestHeader` 為參數，`@RequestBody` 為 JSON 請求內容<br/>4. 單一方法解析失敗時略過並記錄日誌，其餘照常輸出；循環參照型別不造成堆疊溢位<br/>5. SOAP Endpoint 不在範圍內，維持使用 WSDL |
| 驗收標準 | ✅ 沒有已啟用服務時 `paths` 為空物件<br/>✅ 啟用 `example-restful` 後列出 `/example/...` 路由，停用後不重啟即消失 |
