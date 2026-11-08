---
id: restful
title: 管理 RESTful
description: '在管理介面管理 RESTful 服務：新增欄位、服務網址組成規則、啟用時的載入與路徑檢查、Swagger UI／OpenAPI 文件、查看已註冊路由。'
sidebar_label: 管理 RESTful
---

# 管理 RESTful

**RESTful** 頁面（`/dynamic-api/restful`）用來管理從 JAR 載入的 Spring `@RestController`。畫面操作與 [Endpoint 頁面](./endpoint.md) 相同（新增、批次移除、搜尋、開關、編輯、刪除、回應清單），差別在欄位與載入方式。

## 新增 RESTful

| 欄位 | 必填 | 說明 |
|---|---|---|
| 發布名稱 (Publish URI) | 是 | 必須等於 Controller 類別 `@RequestMapping` 路徑的第一段，例如 `/company` → `company`。不可與現有 RESTful 重複。 |
| Class 路徑 | 是 | Controller 類別完整名稱，例如 `com.company.controller.CompanyController`。 |
| JAR 檔案 | 新增時實際必填 | 請上傳 `-plain.jar`。 |

## 服務網址怎麼組成

```
http://localhost:8080/dynamic-api + 類別 @RequestMapping + 方法 @XxxMapping
```

| 類別 | 方法 | 實際網址 |
|---|---|---|
| `@RequestMapping("/company")` | `@PostMapping("/data")` | `POST /dynamic-api/company/data` |
| `@RequestMapping("/example")` | `@GetMapping("/response")` | `GET /dynamic-api/example/response` |

## 啟用時系統做了什麼

1. 以獨立 ClassLoader 載入 JAR 中的類別。
2. 確認類別標註 `@RestController`；沒有標註的類別不會被註冊（也不會報錯）。
3. 檢查類別路徑第一段是否等於 Publish URI，不同則失敗：「Controller 註冊服務失敗，路徑不一致」。
4. 透過 Spring 建立 Controller 實例（會注入 `MockResponseDao`），並把每個標註 `@RequestMapping`、`@GetMapping`、`@PostMapping`、`@PutMapping`、`@DeleteMapping` 的方法註冊到 `RequestMappingHandlerMapping`。

:::note 支援的對應註解
只解析上述五種註解。`@PatchMapping` 不會被註冊；`@GetMapping` 等捷徑註解上的 `params`、`headers`、`consumes`、`produces` 屬性也會被忽略（只有 `@RequestMapping` 會帶入）。
:::

停用時會反向取消註冊所有對應、關閉 ClassLoader，並把 JAR 標記為未使用。系統重啟時，啟用中的 RESTful 會自動重新註冊。

## 編輯與刪除

行為與 Endpoint 相同：

- 編輯後會變成**停用**，需要重新打開開關。
- 修改 Publish URI 時，Mock 回應會跟著搬到新 URI；**請同時重新上傳 JAR**（原因見 [Endpoint 的已知問題](./endpoint.md#編輯)）。
- 刪除會移除設定並刪除 JAR 實體檔案，Mock 回應保留。

## Swagger UI／OpenAPI 文件

已啟用的 RESTful 服務可以直接用 Swagger UI 瀏覽與試打：

| 用途 | 網址 |
|---|---|
| Swagger UI | `http://localhost:8080/dynamic-api/swagger-ui.html` |
| OpenAPI 3 文件（JSON） | `http://localhost:8080/dynamic-api/api/getOpenApi` |

- **只涵蓋已啟用的 RESTful 服務**。SOAP Endpoint 不在這份文件中，請繼續使用 WSDL（`/dynamic-api/webservice/{publishUri}?wsdl`）。
- 文件**每次請求即時產生、不快取**：打開或停用 RESTful、重新上傳 JAR 後，重新整理頁面就會反映，不需要重啟後端。
- 路徑與 HTTP 方法取自實際註冊的路由，因此和上方「啟用時系統做了什麼」的規則一致：路徑正規式（如 `{id:\d+}`）顯示為 `{id}`；未指定方法的 `@RequestMapping` 會列出 GET、POST、PUT、DELETE、PATCH。
- 每個服務以 Publish URI 分組（tag）。`@PathVariable`、`@RequestParam`、`@RequestHeader` 會列為參數，`@RequestBody` 列為 JSON 請求內容；`HttpServletRequest` 這類沒有註解的參數不列出。
- 請求與回應的結構由 Java 欄位推算，循環參照或超過 5 層的物件不再展開。某個方法無法解析（例如 JAR 缺少相依類別）時只略過該方法並記錄日誌，其他路由照常顯示。
- 系統沒有認證機制，Swagger UI 的「Try it out」會直接呼叫 Mock 服務。

## 查看目前註冊的路由

後端有一個 Actuator 端點 `CustomApiMappingsEndpoint`（id：`show-mappings`）可列出已啟用 RESTful 的實際路由，但 `application.yml` 只開放了 `custom-api-mappings`，名稱不一致，因此目前無法透過 HTTP 存取。若要使用，請把 `management.endpoints.web.exposure.include` 改為 `show-mappings`，即可從 `/dynamic-api/actuator/show-mappings` 查詢。
