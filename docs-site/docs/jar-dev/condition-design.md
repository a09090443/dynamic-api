---
id: condition-design
title: Condition 設計指南
description: 'condition 字串的設計策略比較、使用請求 JSON 時的欄位順序陷阱、如何印出 condition，以及給 Mock 維護者的說明範本。'
sidebar_label: Condition 設計指南
---

# Condition 設計指南

`condition` 是整個系統裡最容易出錯的地方：它由 JAR 程式碼產生，卻由另一個人在管理介面手動輸入，而比對方式是**字串完全相等**。好的 condition 設計能讓維護 Mock 回應的人一次就填對。

## 常見策略比較

| 策略 | 產生方式 | 優點 | 缺點 |
|---|---|---|---|
| 整個請求物件的 JSON | `objectMapper.writeValueAsString(request)` | 實作最簡單；範例 JAR 採用 | 任何欄位不同都對不到；`null` 欄位、欄位順序都要一致 |
| 單一關鍵欄位 | `request.getTaxId()` | 好維護、不易填錯 | 同一 key 的其他參數變化無法區分 |
| 多個欄位組合 | `taxId + "\|" + type` | 可控、可讀 | 需要文件說明格式 |
| 請求原文 | `body.strip()` | 維護者直接貼上請求即可 | 空白、換行、欄位順序都必須一致 |
| 固定值 | `"default"` | 一個方法只需一筆回應 | 無法依請求切換情境 |

**建議**：除非真的需要依完整請求區分，否則優先使用「單一關鍵欄位」或「多欄位組合」，並把格式寫在 JAR 的 README 中。

## 使用「請求物件 JSON」時要注意的事

範例 JAR 的做法會產生這樣的字串：

```json
{"name":"Acme","address":null,"phone":null,"email":null,"website":null,"description":null}
```

| 細節 | 說明 |
|---|---|
| `null` 欄位會輸出 | 預設的 `ObjectMapper` 會輸出 `null`。可設定 `setSerializationInclusion(JsonInclude.Include.NON_NULL)` 省略 |
| 欄位順序 | 依類別宣告順序；Jackson 不會參考 JAXB 的 `propOrder`，**不要用肉眼推測** |
| 沒有空白 | 輸出為緊湊格式，管理介面填入時不能有多餘空白或換行 |
| 數字與布林 | `1` 與 `"1"`、`true` 與 `"true"` 是不同字串 |
| 巢狀物件、陣列 | 一併序列化，陣列順序也要一致 |

為了讓順序穩定，建議在 `ObjectMapper` 上開啟排序：

```java
ObjectMapper mapper = JsonMapper.builder()
        .configure(MapperFeature.SORT_PROPERTIES_ALPHABETICALLY, true)
        .serializationInclusion(JsonInclude.Include.NON_NULL)
        .build();
```

## 把 condition 印出來

無論選哪種策略，都請在查詢前把 `method` 與 `condition` 寫進日誌：

```java
log.info("mock lookup: method={}, condition={}", method, condition);
```

維護回應的人只要先呼叫一次，從日誌複製字串就不會填錯。範例 RESTful JAR 的 `request json:{...}` 就是這個用途。

## 寫給維護者的說明範本

在 JAR 的 README 中，為每個方法提供一張表：

| 服務 | Publish URI | method | condition 格式 | 回應內容格式 |
|---|---|---|---|---|
| 查詢公司 | `company` | `getCompany` | 請求的 `taxId`，例如 `224567` | 完整 SOAP Envelope，Body 節點前綴需為 `ns4:` |
| 查詢訂單 | `order` | `query` | `{customerId}\|{status}`，例如 `C001\|OPEN` | `OrderResult` 的 JSON |
