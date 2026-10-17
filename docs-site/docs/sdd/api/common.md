---
id: common
title: 5.4 共用 API（/common）
sidebar_label: 5.4 共用 API
---

# 5.4 共用 API（`/dynamic-api/common`）

## POST `/uploadJarFile`

`multipart/form-data`，欄位 `file`。

```json title="成功回應"
{
  "code": 200, "message": "OK",
  "data": { "jarFileId": "03ac1ee7-…", "jarFileName": "5b1f2c…-….jar" }
}
```

| 結果 | 回應 |
|---|---|
| 檔案為空或原始檔名不是 `.jar` 結尾 | `code=400` |
| 超過 100MB | Spring multipart 例外，HTTP 500 |

## Mock 回應

**MockResponseRequestDTO**

| 欄位 | 型別 | 說明 |
|---|---|---|
| `id` | string | 修改時必填 |
| `publishUri` | string | |
| `method` | string | |
| `condition` | string | |
| `responseContent` | string | |
| `serviceType` | `ENDPOINT` \| `RESTFUL` | |
| `status` | boolean | 未使用 |

**MockResponseResponseDTO**：`id`、`publishUri`、`method`、`condition`、`responseContent`、`isActive`。

### POST `/getResponseList`

```json title="請求"
{ "publishUri": "company", "serviceType": "ENDPOINT" }
```

回傳該 Publish URI 與服務類型下的所有回應。`publishUri` 空白時丟出例外（HTTP 500）。

:::note
`serviceType` 未提供時，JPA 衍生查詢會以 `SERVICE_TYPE IS NULL` 條件查詢，結果為空清單。
:::

### POST `/getResponseContent`

```json title="請求"
{ "publishUri": "company", "method": "getCompany", "condition": "{…}", "serviceType": "ENDPOINT" }
```

回傳 `data` 為命中且**啟用中**的回應內容；查無時為空字串。三個鍵任一空白時丟出例外。

### POST `/saveMockResponse`

```json title="請求"
{
  "publishUri": "company",
  "method": "getCompany",
  "condition": "{\"employees\":null,\"name\":\"Company\",\"taxId\":\"224567\"}",
  "serviceType": "ENDPOINT",
  "responseContent": "<?xml version=\"1.0\"?><soap:Envelope …>"
}
```

成功時 `data` 為請求內容加上新產生的 `id`（`isActive` 未設定，實際為停用）。`publishUri`、`method`、`condition` 任一空白回應 `code=400`。

### POST `/updateResponse`

請求同上並帶 `id`。實作為刪除該 `id` 後重新新增，因此**新紀錄的 `id` 與請求不同，且為停用**；回應的 `data` 仍是請求內容（舊 `id`）。前端更新後會重新載入清單以取得新 `id`。

### DELETE `/deleteResponse`

```json title="請求本文：id 陣列"
["32703ad5-046d-44fe-ad9b-306df5618e8f"]
```

### GET `/switchResponse`

| 參數 | 說明 |
|---|---|
| `id` | 回應 ID |
| `isActive` | `true` / `false` |

例外會被記錄後吞掉，一律回傳成功。

## GET `/logs/stream`

Server-Sent Events（`text/event-stream;charset=UTF-8`）。

| 參數 | 預設 | 說明 |
|---|---|---|
| `logFileName` | `MockWebservice.log` | 相對於 `log.base` 的檔名 |
| `tailLines` | `100` | 先送出的末尾行數 |

行為：送出末尾 N 行 → 以 `WatchService` 監看目錄，檔案變大時送出新增內容 → 30 秒逾時結束。檔案不存在時送出 `Log file not found: …` 後結束。

```bash
curl -N "http://localhost:8080/dynamic-api/common/logs/stream?tailLines=50"
```

:::danger
`logFileName` 未檢查 `..`，可讀取 `log.base` 以外的檔案。部署到共用環境前應修正（TD-07）。
:::
