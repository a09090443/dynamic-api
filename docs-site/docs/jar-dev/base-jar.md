---
id: base-jar
title: base-jar 與 Mock 查詢 API
description: 'base-jar 提供的 RestfulBase、WebserviceBase 與 MockResponseDao，如何放進專案，以及 findByPrimaryKey 的查詢行為。'
sidebar_label: base-jar 與查詢 API
---

# base-jar 與 Mock 查詢 API

`base-jar/` 提供自訂 JAR 編譯時需要的類別。它的內容和後端 `com.dynamicapi` 底下的同名類別完全相同；執行期實際使用的是後端那一份（見 [開發總覽](./overview.md#1-每個服務有自己的-classloader而且父優先)）。

## 內容

| 類別 | 用途 |
|---|---|
| `com.dynamicapi.jarbase.RestfulBase` | RESTful Controller 的基底類別 |
| `com.dynamicapi.jarbase.WebserviceBase` | SOAP 實作類別的基底類別 |
| `com.dynamicapi.dao.MockResponseDao` | 查詢 Mock 回應 |
| `com.dynamicapi.enums.ServiceType` | `RESTFUL`、`ENDPOINT` |
| `com.dynamicapi.jdbc.*` | `MockResponseDao` 使用的 JDBC 封裝 |

## 建置並放進你的專案

```powershell
cd base-jar
.\gradlew.bat jar
```

把 `build\libs\` 下產生的 `-plain.jar` 複製為你的專案的 `src/main/lib/base.jar`，並在 `build.gradle.kts` 加入：

```kotlin
dependencies {
    implementation(files("src/main/lib/base.jar"))
}
```

範例專案已附上一份 `src/main/lib/base.jar`，可直接沿用。

## 基底類別 API

兩個基底類別結構相同，差別只在查詢時帶入的 `ServiceType`：

```java
public abstract class RestfulBase {
    protected MockResponseDao mockResponseDao;   // 由 Spring 注入

    protected <T> T findByPrimaryKey(String publishUri, String method,
                                     String condition, Class<T> clazz) {
        return mockResponseDao.findByPrimaryKey(publishUri, method, condition,
                                                ServiceType.RESTFUL, clazz);
    }
}
```

`WebserviceBase.findByPrimaryKey(...)` 則固定使用 `ServiceType.ENDPOINT`。

:::caution 注入點是 `final` 方法
`setMockResponseDao` 宣告為 `final`，子類別不能覆寫。若在建構子裡就使用 `mockResponseDao`，此時尚未注入，會得到 `null`。
:::

## `findByPrimaryKey` 的行為

| 參數 | 說明 |
|---|---|
| `publishUri` | 建議寫死成與管理介面一致的 Publish URI 字串 |
| `method` | 自訂的方法鍵，通常用 Java 方法名稱 |
| `condition` | 自訂的情境鍵，見 [Condition 設計指南](./condition-design.md) |
| `clazz` | 回傳型別。實務上一律使用 `String.class`，再自行轉換 |

查詢語句：

```sql
SELECT mr.RESPONSE_CONTENT AS content
FROM MOCK_RESPONSE mr
WHERE mr.PUBLISH_URI = :publishUri AND mr.METHOD = :method
  AND mr.CONDITION = :condition AND mr.SERVICE_TYPE = :serviceType
  AND mr.IS_ACTIVE = TRUE
```

查詢結果以 Spring `NamedParameterJdbcTemplate.queryForObject(sql, params, clazz)` 取出單一欄位，所以 `clazz` 必須是 JDBC 能直接轉換的單值型別（`String` 最合適），**不能**直接傳入 DTO 類別期待它自動解析 JSON。

| 情況 | 回傳值 |
|---|---|
| 命中一筆 | `response_content` 字串 |
| 查無資料或發生任何例外 | 記錄錯誤日誌，回傳 `clazz` 的無參數建構實例（`String` → `""`）；無法建構時回傳 `null` |

因此**一定要先判斷 `null` 與空白**，否則直接 `readValue("")` 會丟出 `No content to map due to end-of-input`，呼叫端收到 HTTP 500。

查無時請**直接回傳帶 404 的 `ResponseEntity`**，不要 `throw new ResponseStatusException(HttpStatus.NOT_FOUND, ...)`：後端的 `GlobalExceptionHandler` 與 zipe `ResponseResultBodyAdvice` 都以 `@ExceptionHandler(Exception.class)` 攔截所有例外，拋出的例外會變成 HTTP 500（見 [安全與錯誤處理](../sdd/security-errors.md)）。

類別有 `@ResponseResultBody` 時（`company-restful`、`example-restful` 的寫法），回傳型別用 `ResponseEntity<Object>`。`@ResponseResultBody` **不會**包裝 `ResponseEntity` 內的本文，所以成功與 404 兩個分支的本文都要自行包成 zipe `Result`：

```java
String content = findByPrimaryKey("company", "getResponseData", condition, String.class);
if (content == null || content.isBlank()) {
    Map<String, String> error = new LinkedHashMap<>();
    error.put("error", "MOCK_RESPONSE_NOT_FOUND");
    error.put("publishUri", "company");
    error.put("method", "getResponseData");
    error.put("condition", condition);
    // NotFoundStatus 是實作 com.zipe.exception.IResultStatus 的列舉（HttpStatus.NOT_FOUND、404、訊息）
    return ResponseEntity.status(HttpStatus.NOT_FOUND)
            .contentType(MediaType.APPLICATION_JSON)
            .body(Result.failure(NotFoundStatus.MOCK_RESPONSE_NOT_FOUND, error));
}
return ResponseEntity.ok(Result.success(objectMapper.readValue(content, CompanyResponseDTO.class)));
```

命中時回 HTTP 200 與 `{code:200, message:"OK", data:{...}}`；查無時回 HTTP 404 與 `{code:404, message:"Mock response not found", data:{error, publishUri, method, condition}}`。若直接寫 `ResponseEntity.ok(dto)` 而不包成 `Result`，回應本文會是裸 DTO，沒有外層的 `code`、`message`、`data`；不要用 `ResponseEntity<String>` 回傳 JSON。

類別沒有 `@ResponseResultBody` 時（`inventory-restful` 的寫法），直接回傳 `ResponseEntity.status(HttpStatus.NOT_FOUND)` 加 JSON 本文即可。
