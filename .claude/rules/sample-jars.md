---
paths:
  - "endpoints/**"
  - "restfuls/**"
---

# 自訂 JAR 範例專案

這些專案是使用者撰寫 JAR 的範本，文件（`docs-site/docs/guide/quick-start.md`、`docs-site/docs/jar-dev/`）直接引用其中的類別名稱、路徑與程式碼。修改時要同步更新文件。

- `endpoints/company-endpoint`：SOAP Endpoint 範例。
- `restfuls/company-restful`：Gradle Kotlin DSL RESTful 範例。
- `restfuls/example-restful`：Maven RESTful 範例。
- `restfuls/inventory-restful`：Gradle Kotlin DSL RESTful 範例；示範在查無 Mock 回應時安全回傳 HTTP 404。

## 必須遵守

- RESTful Controller 繼承 `com.dynamicapi.jarbase.RestfulBase`，標註 `@RestController`，類別 `@RequestMapping` 第一段 = 建立時填的 Publish URI（`company-restful` 為 `/company` ↔ `company`）。
- SOAP 實作類別繼承 `com.dynamicapi.jarbase.WebserviceBase`；建立 Endpoint 時 Class 路徑填**實作類別**，不是介面。
- `findByPrimaryKey` 的第一個參數（publishUri）與管理介面建立時的 Publish URI 一致；`method` 字串與文件中的範例一致（`getResponseData`、`getCompany`）。
- 不使用 `com.dynamicapi` 套件名稱（會被後端同名類別遮蔽）。
- 只能使用後端 classpath 上已有的套件（Spring Boot 3.2.5、CXF 4、Jackson、zipe starters 等），或把額外套件攤平打包進 JAR。
- `base.jar` 放在 `src/main/lib/base.jar`，以 `implementation(files(...))` 引用；更新方式見 `.claude/rules/base-jar.md`。
- 在 `endpoints/` 或 `restfuls/` 新增 RESTful 或 SOAP 服務時，必須在既有的 `postman/Endpoints.postman_collection.json` 中為該服務新增以服務命名的資料夾：RESTful 收錄每個 API 的呼叫請求；SOAP 收錄 WSDL 的 GET 請求與每個 operation 的 POST 請求。不得刪除、改名或覆寫既有項目，且集合必須維持有效的 Postman Collection v2.1 JSON；請求內容與驗證、交付細節依 `.agents/skills/dynamic-api-jar-builder/SKILL.md` 的工作流程第 5～7 步辦理。

## 建置

- Gradle toolchain 鎖定 **JDK 17**（`languageVersion = 17`），機器上需要有 JDK 17。
- 使用 `.\gradlew.bat jar`，上傳 `build/libs/*-plain.jar`。`build` 會觸發 `bootJar`，產出的 fat JAR 類別位於 `BOOT-INF/classes/`，系統無法載入，而且範例沒有 `main` 類別。
- `restfuls/inventory-restful` 不附 Gradle Wrapper，使用系統安裝的 Gradle 執行 `gradle jar`，同樣上傳 `build/libs/*-plain.jar`。
- `restfuls/example-restful` 使用 Maven（`pom.xml`），其他使用 Gradle Kotlin DSL。

## 範例程式的已知缺點（作為範本時注意）

舊範例 `restfuls/company-restful` 與 `restfuls/example-restful` 在查無 Mock 回應時直接 `objectMapper.readValue("")`，會讓呼叫端得到 HTTP 500。`restfuls/inventory-restful` 已同時判斷 `null` 與空白內容並回傳 HTTP 404；新寫的範例或修改時應採用相同防護，並參考 `docs-site/docs/jar-dev/base-jar.md` 的建議寫法。
