# inventory-restful

RESTful JAR 範例：庫存查詢與新增。示範查不到 Mock 回應時回傳 HTTP 404 與明確的錯誤內容，而不是 HTTP 500。

| 項目 | 值 |
|---|---|
| Publish URI | `inventory` |
| Controller 類別路徑 | `com.sample.inventory.controller.InventoryController` |
| 呼叫網址前綴 | `http://localhost:8080/dynamic-api/inventory` |

Mock 回應內容會原樣回傳（`Content-Type: application/json`），沒有加 `@ResponseResultBody`，適合模擬第三方 API 的原始格式。

## 路由

| HTTP 方法 | 路徑 | methodKey | condition |
|---|---|---|---|
| GET | `/inventory/items/{itemId}` | `getItem` | 路徑參數 `itemId` 原值，例如 `A001` |
| POST | `/inventory/items` | `createItem` | 請求本文的 `sku` 字串，例如 `{"sku":"A001","quantity":5}` → `A001` |

錯誤回應：

| 情況 | HTTP 狀態 | 回應內容 |
|---|---|---|
| 查不到啟用中的 Mock 回應，或內容為空白 | 404 | `{"error":"MOCK_RESPONSE_NOT_FOUND","publishUri":"inventory","method":"<methodKey>","condition":"<condition>"}` |
| POST 的 `sku` 缺少或空白（不會查詢 Mock） | 400 | `{"error":"SKU_REQUIRED"}` |

## 可直接建立的 Mock 回應

| Publish URI | Method | Condition | 回應內容 |
|---|---|---|---|
| `inventory` | `getItem` | `A001` | `{"itemId":"A001","name":"Sample Widget","stock":42}` |
| `inventory` | `createItem` | `A001` | `{"itemId":"A001","created":true}` |

## 建置

本範例不附 Gradle Wrapper，使用系統安裝的 Gradle（機器上需要 JDK 17）：

```bash
gradle jar
```

上傳 `build/libs/inventory-restful-1.0-plain.jar`。不要用 `gradle build` 產生的 boot JAR，它的類別位於 `BOOT-INF/classes/`，系統無法載入。

## 使用流程

1. 在管理介面上傳 `inventory-restful-1.0-plain.jar`。
2. 建立 RESTful：Publish URI 填 `inventory`，Class 路徑填 `com.sample.inventory.controller.InventoryController`。
3. 手動啟用該 RESTful（新建或編輯後預設為停用）。
4. 依上表建立 Mock 回應。
5. 手動啟用 Mock 回應（新建或編輯後預設為停用）。
6. 呼叫：

```bash
curl http://localhost:8080/dynamic-api/inventory/items/A001
curl -X POST http://localhost:8080/dynamic-api/inventory/items \
  -H 'Content-Type: application/json' \
  -d '{"sku":"A001","quantity":5}'
```

把 `A001` 換成沒有建立 Mock 的值（例如 `B999`），會得到 404 與上述錯誤內容。

詳細說明見文件網站的 [開發 RESTful JAR](../../docs-site/docs/jar-dev/restful-jar.md)。
