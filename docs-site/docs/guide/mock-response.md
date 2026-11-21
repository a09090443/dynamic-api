---
id: mock-response
title: 管理 Mock 回應
description: 'Mock 回應的比對規則（publishUri、method、condition、serviceType 完全相等且啟用）、欄位說明、常用操作與多情境設計方式。'
sidebar_label: 管理 Mock 回應
---

# 管理 Mock 回應

Mock 回應決定「呼叫端打進來時要回什麼」。從 SOAP Endpoint 清單點發布名稱或 **N 筆 ›**、從 RESTful 清單點 **回應清單 ›**，就會進入該服務的 Mock 回應頁面（網址帶有 `?publishUri=...&serviceType=...`）。直接從側欄「Mock 回應」進入而沒有指定服務時，頁面只顯示引導與前往兩個清單的連結。

頁面上方的資訊卡顯示服務類型（SOAP／REST）、服務是否啟用，以及呼叫位址（SOAP：`/dynamic-api/webservice/{publishUri}`，RESTful：`/dynamic-api/{publishUri}`，主機取自目前瀏覽器網址），可按 **複製**。

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
| 方法名稱（必填） | `method` | 例如 `getCompany`、`getResponseData`；需與 JAR 程式傳入的 method 一致 |
| 條件 | `condition` | 例如請求物件的 JSON 字串；留空代表 JAR 未帶條件，清單中顯示「（無條件）」 |
| 回應內容 | `responseContent` | JAR 會拿這段字串轉成回應：RESTful 範例是 JSON，SOAP 範例是完整 SOAP Envelope XML。**格式化** 按鈕可排版 JSON 或 XML，只調整縮排與換行，數字（含大整數、`1.10`）、字串、CDATA、註解與屬性值都原樣保留；內容不是有效的 JSON／XML，或含無法安全排版的結構（`xml:space`、DOCTYPE 內部定義）時不會改動，並提示原因 |

## 常用操作

新增與編輯都在頁面右側的編輯面板進行（窄螢幕時面板會覆蓋在畫面上），清單中編輯中的那一列會以藍色左線標示。

| 操作 | 說明 |
|---|---|
| 新增 | 按 **新增回應** 開啟空白面板。建立後為**停用**，記得打開開關。 |
| 編輯 | 點清單中的一列（或用鍵盤選取後按 Enter）開啟面板。系統以「刪除後重新新增」實作，因此編輯後**會產生新的 ID 並回到停用狀態**，需要重新打開開關。儲存中欄位暫時無法修改，也不能關閉面板或切換到其他列；儲存失敗時面板會保留輸入並顯示錯誤，可直接再按儲存。 |
| 開關 | 每列的開關啟用／停用單筆回應，先跳出確認框；成功後提示可按 **復原**。立即生效，不需要重新啟用服務。 |
| 刪除 | 在編輯面板按 **刪除**，確認後直接從資料庫刪除，無法復原。 |

:::note 開關失敗的判斷
後端的 `switchResponse` 會吞掉內部例外並一律回報成功，因此畫面只有在網路或 HTTP 錯誤時才會顯示切換失敗。
:::

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

`findByPrimaryKey` 查無資料時不會丟出例外，而是回傳「指定型別的空物件」：要求 `String` 就得到空字串 `""`。接下來的行為由 JAR 決定：範例 RESTful JAR 會先判斷空值，回傳 HTTP 404（`company-restful`、`example-restful` 的本文含 `MOCK_RESPONSE_NOT_FOUND` 與實際使用的 `condition`）；自寫 JAR 若沒有處理空字串，就會因解析失敗回傳 HTTP 500。排查步驟見 [疑難排解](./troubleshooting.md#呼叫服務得到-404)。
