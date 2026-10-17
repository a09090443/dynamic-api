---
id: mock-response
title: 管理 Mock 回應
description: 'Mock 回應的比對規則（publishUri、method、condition、serviceType 完全相等且啟用）、欄位說明、常用操作與多情境設計方式。'
sidebar_label: 管理 Mock 回應
---

# 管理 Mock 回應

Mock 回應決定「呼叫端打進來時要回什麼」。從 Endpoint 或 RESTful 清單按 **回應清單** 圖示，就會進入該服務的 Response 頁面（網址帶有 `?publishUri=...&serviceType=...`）。

## 回應是怎麼被找到的

JAR 程式碼呼叫 `findByPrimaryKey(publishUri, method, condition, ...)` 時，系統執行：

```sql
SELECT RESPONSE_CONTENT FROM MOCK_RESPONSE
WHERE PUBLISH_URI = :publishUri
  AND METHOD = :method
  AND CONDITION = :condition
  AND SERVICE_TYPE = :serviceType
  AND IS_ACTIVE = TRUE
```

也就是說：

- **四個鍵都要完全相同**（區分大小寫、空白、欄位順序）。沒有模糊比對、萬用字元或優先順序。
- **回應必須是啟用狀態**。停用的回應等同不存在。
- `method` 與 `condition` 的值**由 JAR 程式碼決定**，不是由系統解析請求而來。要填什麼，請看該 JAR 的實作或詢問開發人員；範例 JAR 的規則見 [Condition 設計指南](../jar-dev/condition-design.md)。

## 欄位說明

| 畫面欄位 | 對應欄位 | 說明 |
|---|---|---|
| （自動帶入） | `publishUri` | 來自網址參數 |
| （自動帶入） | `serviceType` | `ENDPOINT` 或 `RESTFUL`，來自網址參數 |
| 呼叫方法名稱 | `method` | 例如 `getCompany`、`getResponseData` |
| Response條件 | `condition` | 例如請求物件的 JSON 字串 |
| 回應內容 | `responseContent` | JAR 會拿這段字串轉成回應：RESTful 範例是 JSON，SOAP 範例是完整 SOAP Envelope XML |

## 常用操作

| 操作 | 說明 |
|---|---|
| 新增 | 建立後為**停用**，記得打開開關。 |
| 展開列 | 查看完整的條件與回應內容。 |
| 開關 | 啟用／停用單筆回應，立即生效，不需要重新啟用服務。 |
| 編輯 | 系統以「刪除後重新新增」實作，因此編輯後**會產生新的 ID 並回到停用狀態**，需要重新打開開關。 |
| 刪除 / 批次刪除 | 直接從資料庫刪除。 |

:::warning 相同鍵值會直接覆蓋
若新增的回應與既有回應的 `publishUri + method + condition + serviceType` 完全相同，資料庫會以新資料覆蓋舊的那筆，而不是報錯。
:::

## 設計多情境回應的方式

因為比對是「條件字串完全相同」，要讓同一個 API 回不同結果，就是對不同的請求內容各建一筆回應：

| method | condition | 回應內容 | 用途 |
|---|---|---|---|
| `getCompany` | `{"employees":null,"name":"Company","taxId":"224567"}` | 正常資料 | 成功情境 |
| `getCompany` | `{"employees":null,"name":"Company","taxId":"000000"}` | 查無資料的回應 | 查無情境 |
| `getCompany` | `{"employees":null,"name":"Company","taxId":"999999"}` | SOAP Fault | 錯誤情境 |

要切換同一個請求的回應版本（例如從成功改成失敗），可以先停用舊回應、再啟用另一筆——但兩筆的鍵值不能完全相同，所以實務上通常是直接**編輯回應內容**後再啟用。

## 查無回應時會發生什麼

`findByPrimaryKey` 查無資料時不會丟出例外，而是回傳「指定型別的空物件」：要求 `String` 就得到空字串 `""`。接下來的行為由 JAR 決定，以兩個範例 JAR 來說都會因為解析空字串失敗而回傳 HTTP 500。排查步驟見 [疑難排解](./troubleshooting.md#呼叫服務得到-500)。
