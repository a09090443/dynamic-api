---
name: dynamic-api-jar-builder
description: 'Use when converting REST API documentation, OpenAPI/Swagger specifications, Postman collections, or SOAP WSDL files into a Dynamic API Manager-compatible Java JAR; creating RESTful or SOAP example project files; or explaining and running JAR packaging and validation.'
argument-hint: '[API 文件或 WSDL 路徑，以及 publishUri、套件名稱等偏好]'
---

# Dynamic API JAR Builder

依照 Dynamic API Manager 的執行模型，將 API 規格或 WSDL 落實為可動態載入的 RESTful 或 SOAP Java 專案，並產生正確的 JAR。也可在使用者只要求範例檔時，建立完整、可編譯的範例專案並說明打包方式。

## 適用情境

- 使用者提供 OpenAPI、Swagger、Postman、Markdown、PDF 或其他 REST API 規格，希望轉成 RESTful JAR。
- 使用者提供 WSDL（以及相關 XSD），希望轉成 SOAP Endpoint JAR。
- 使用者希望依照既有 API 規格建立 Controller、DTO、SOAP SEI、JAXB DTO、實作類別或專案範例。
- 使用者需要知道如何建置、檢查、上傳及註冊產出的 JAR。

## 工作流程

1. **確認輸入與目標**
   - 從對話附件或使用者指定的路徑讀取規格。若只有片段，清楚標示未提供的資訊，不要假裝已讀取完整文件。
   - 判斷輸入是 REST API 還是 SOAP WSDL；若混合，分成不同服務處理。
   - 擷取服務名稱、base path、操作名稱、HTTP/SOAP 方法、參數、request/response schema、內容型別、錯誤格式，以及 WSDL 的 namespace、binding、service、port、operation、fault 和匯入的 XSD。
   - 確認或提出合理預設：`publishUri`、Java package、Controller/實作類別名稱、Mock `method` key 和 `condition` 格式。這些值會影響後續註冊與 Mock 回應比對。
   - 只在缺少的資訊會改變公開路徑、類別路徑、SOAP 契約或 Mock 比對方式時追問；其他情況採用清楚且一致的預設，並在交付摘要列出。

2. **載入專案規範與範本**
   - 修改 `endpoints/**` 或 `restfuls/**` 前先讀 `.claude/rules/sample-jars.md`。
   - 依服務類型參考：
     - REST：`docs-site/docs/jar-dev/restful-jar.md`、`restfuls/company-restful/`
     - SOAP：`docs-site/docs/jar-dev/endpoint-jar.md`、`endpoints/company-endpoint/`
     - 基礎 API、依賴與類別載入：`docs-site/docs/jar-dev/base-jar.md`、`docs-site/docs/jar-dev/overview.md`
     - 打包與部署：`docs-site/docs/jar-dev/build-deploy.md`
   - 優先新增獨立範例目錄，不要覆寫現有範例或使用者檔案。依照 repo 既有慣例使用 Gradle Kotlin DSL；若使用者指定現有 Maven 專案，保留其建置系統。

3. **產生 RESTful JAR**
   - 建立 `@RestController`，繼承 `com.dynamicapi.jarbase.RestfulBase`。
   - 類別 `@RequestMapping` 的第一段路徑必須等於註冊時的 `publishUri`。每筆 RESTful 設定只載入一個 Controller；不同 base path 需要分開註冊。
   - 動態註冊支援 `@RequestMapping`、`@GetMapping`、`@PostMapping`、`@PutMapping`、`@DeleteMapping`。不要使用 `@PatchMapping`；若規格需要 PATCH，先明確說明此限制並提出相容替代方案，不可默默改變契約。
   - 每個操作以穩定且明確的字串呼叫 `findByPrimaryKey(publishUri, methodKey, condition, String.class)`。將 `methodKey` 和 `condition` 規則寫入 README，讓 Mock 回應可重現地命中。
   - 根據輸入 schema 建立 DTO；以 Jackson 等後端已提供的套件處理 JSON。查無回應或空白回應時先處理空值，不要直接反序列化空字串。
   - 回應符合第三方 API 原始格式時，不要自動加 `@ResponseResultBody` 包裝。只有規格或使用者要求該包裝格式時才使用。
   - 不要把範例實作描述成反向代理。此系統由 JAR 依 `method` 和 `condition` 查詢已設定的 Mock 回應。

4. **產生 SOAP Endpoint JAR**
   - 優先使用系統 WSDL 轉 Java 工具；本機服務可用時，依 `docs-site/docs/guide/wsdl-tool.md` 使用上傳檔案方式。URL 模式需確認後端能連線，且已知管理介面 URL 欄位問題時不要依賴該介面模式。
   - 若工具不可用，使用 Apache CXF `wsdl2java`，並處理 WSDL/XSD 的相依檔案。從產物挑選服務端需要的 SEI、request/response JAXB 類別及 `package-info.java`；通常不需要 `*_Service`、client 或範例 client 類別。
   - 實作類別繼承 `com.dynamicapi.jarbase.WebserviceBase` 並實作 SEI；`@WebService(endpointInterface=...)` 指向 SEI。註冊 Endpoint 的 `classPath` 必須填實作類別完整名稱，不是介面。
   - 以固定的 `publishUri`、operation `methodKey` 和文件化的 condition 呼叫 `findByPrimaryKey(...)`。依照實際 SOAP envelope、namespace 與回應節點轉換 response；不可臆測 namespace 前綴或刪除必要 JAXB 註解。
   - 處理空 Mock 回應與 SOAP fault；若規格或範例依賴 prefix-sensitive XML 擷取，說明該前綴必須和 Mock XML 一致。

5. **整理相依與專案檔**
   - JDK toolchain 使用 Java 17，套件名稱不得使用 `com.dynamicapi`，避免與後端類別衝突。
   - 透過 `src/main/lib/base.jar` 引用 `RestfulBase` / `WebserviceBase` 等編譯 API。若檔案不存在，在 repo 根目錄執行下列命令，再把 `base-jar/build/libs/*-plain.jar` 複製到範例專案的 `src/main/lib/base.jar`：

     ```powershell
     Set-Location base-jar
     & (Join-Path $PWD 'gradlew.bat') jar
     ```

   - 僅依賴後端執行期已有的套件；額外執行期相依不能只放在 Gradle `implementation`，因上傳的 plain JAR 不會帶入相依套件。需要額外套件時，說明採用攤平打包或要求後端提供套件，避免產出執行時缺類別的 JAR。
   - 範例專案至少提供建置設定、Java 原始碼及 README。README 說明來源規格、路由/操作對應、`publishUri`、類別路徑、`methodKey` / `condition`、建置命令和 JAR 輸出位置；必要時附上可直接建立 Mock 的範例條件與回應。
   - README 必須另有「呼叫方法／呼叫範例」一節，內容與第 7 步的呼叫方法相同：RESTful 服務列出每個 API 的 HTTP 方法、完整網址、必要 header、請求範例與 curl 範例；SOAP 服務列出服務網址、WSDL 網址、每個 operation 的 SOAP envelope 與 curl 範例。每個操作都標出命中 Mock 用的 `method` 與 `condition`，並寫明呼叫成功的前提（見第 7 步）。
   - **更新 Postman 集合**：建立 RESTful 或 SOAP JAR 後，把該服務的呼叫請求加進既有的 `postman/Endpoints.postman_collection.json`，不要另外建立新的集合檔。
     - 在最上層 `item` 為這個服務新增一個以服務名稱命名的資料夾；請求名稱沿用現有 `Company` 資料夾的寫法 `{服務名}_{操作}`。
     - RESTful：每個操作一個請求，包含 HTTP 方法、完整網址 `http://{host}:{port}/dynamic-api/{publishUri}/...`（含 path variable 與 query 參數）、有 request body 時的 `Content-Type: application/json` header，以及依規格 DTO 產生的請求範例。
     - SOAP：一個 GET `http://{host}:{port}/dynamic-api/webservice/{publishUri}?wsdl` 請求，加上每個 operation 一個 POST `http://{host}:{port}/dynamic-api/webservice/{publishUri}` 請求；POST 帶 `Content-Type: text/xml` header，body 是依 WSDL 實際 namespace 與元素名稱寫成的 SOAP envelope；WSDL binding 有定義 soapAction 時才加上相符的 `SOAPAction` header。
     - 主機與 port 的寫法與第 7 步相同：使用者有提供就用提供的值，未提供時用 `http://localhost:8080`。現有集合沒有定義變數，不要為此新增集合層級的變數或改動 `info`。
     - 不得刪除、改名或覆寫既有項目（包括 `Company` 資料夾與 `Upload_jar_file`）。同名資料夾已存在時不要覆寫，在交付摘要說明並請使用者決定。
     - 修改後檔案必須是有效的 JSON，並維持 Postman Collection v2.1 的 schema（`info.schema` 不變）。

6. **建置及驗證**
   - 在專案目錄使用下列命令（若有測試則一併執行 `test`）。執行前確認目前環境有 JDK 17；若無法建置，回報實際阻礙，不要宣稱 JAR 已產生。

     ```powershell
     & (Join-Path $PWD 'gradlew.bat') test
     & (Join-Path $PWD 'gradlew.bat') jar
     ```

   - Gradle 專案預期產物為 `build/libs/{name}-{version}-plain.jar`。Maven 專案依其設定確認輸出的普通 JAR，不要假設檔名相同。
   - 用 `jar tf <jar-path>` 檢查類別位於 JAR 根目錄，不在 `BOOT-INF/classes/`；確認沒有把 `com/dynamicapi/**` 基底類別或不必要的 fat-JAR 內容包進去。
   - 盡可能執行測試或編譯，並檢查 REST 路由及 OpenAPI 契約，或 SOAP 產生的 WSDL、namespace 和 operation。清楚區分「已建置驗證」與「尚未在執行中的 Dynamic API Manager 實際呼叫驗證」。
   - 確認 `postman/Endpoints.postman_collection.json` 可以被解析成 JSON（例如以 JSON 解析器讀取或匯入 Postman），且既有項目仍在；無法解析時先修正，不要交付損壞的集合。

7. **說明如何使用產物**
   - 列出新建/修改的主要檔案、建置命令、JAR 的完整相對路徑、驗證結果及未涵蓋的規格。
   - 列出已更新的 Postman 檔案路徑（`postman/Endpoints.postman_collection.json`），以及新增的資料夾與每個請求名稱。
   - REST 註冊要提供 `publishUri` 和 Controller `classPath`；SOAP 註冊要提供 `publishUri`、`beanName` 和實作類別 `classPath`。
   - 說明打包只會產生 JAR，不會自動上傳、建立或啟用服務。上傳後仍需在管理介面或管理 API 建立設定、啟用服務、建立並啟用 Mock 回應，最後呼叫 endpoint 驗證。
   - 交付時必須提供產出服務的呼叫方法。主機與 port 使用使用者提供的值；未提供時明確標示採用預設 `http://localhost:8080`。每個操作都要標出命中 Mock 回應用的 `method` 與 `condition`。
   - **RESTful JAR（API 呼叫方法）**：逐一列出每個操作的
     - HTTP 方法；
     - 完整網址：`http://{host}:{port}/dynamic-api` + 類別 `@RequestMapping` + 方法 mapping（含 path variable 與 query 參數的填法），例如類別 `@RequestMapping("/company")`、方法 `@PostMapping("/data")` 為 `POST http://localhost:8080/dynamic-api/company/data`；
     - 必要的 header，例如有 request body 時的 `Content-Type: application/json`；
     - 依規格 DTO 產生的請求範例（request body 或參數）；
     - 可直接執行的呼叫範例，例如：

       ```bash
       curl -X POST 'http://localhost:8080/dynamic-api/company/data' \
         -H 'Content-Type: application/json' \
         -d '{"id":"A001"}'
       ```

   - **SOAP JAR（Web Service 呼叫方法）**：提供
     - 服務網址：`http://{host}:{port}/dynamic-api/webservice/{publishUri}`；
     - WSDL 網址：服務網址加上 `?wsdl`；
     - 每個 operation 的 SOAP envelope 請求範例，使用 WSDL 實際的 namespace 與元素名稱，不可臆測；
     - 可直接執行的呼叫範例，使用 `Content-Type: text/xml`；WSDL binding 有定義 SOAPAction 時一併帶入相符的 `SOAPAction` header，例如：

       ```bash
       curl -X POST 'http://localhost:8080/dynamic-api/webservice/company' \
         -H 'Content-Type: text/xml; charset=utf-8' \
         -d @getCompany-request.xml
       ```

       若該 operation 在 WSDL 定義了 `soapAction="urn:company:v1:updateCompany"`，再加上 `-H 'SOAPAction: "urn:company:v1:updateCompany"'`。

   - 寫明呼叫成功的前提：已上傳 JAR、已建立並啟用服務（RESTful 或 Endpoint），且已建立並啟用對應 `method` / `condition` 的 Mock 回應；任一項未完成時呼叫不會得到預期回應。
   - 呼叫範例與驗證結果分開寫。沒有在執行中的 Dynamic API Manager 實際呼叫成功，只能標示為「尚未實際呼叫驗證」，不可宣稱呼叫已驗證；已實際呼叫時附上實際的請求與回應摘要。

## 專案限制

- JAR 由父優先 ClassLoader 載入，執行期的 Spring、CXF、Jackson 和 `com.dynamicapi.*` 由後端提供；`base.jar` 僅供編譯。
- Mock 回應以啟用中的 `(publishUri, method, condition, serviceType)` 精確比對。程式中的 key 和管理介面新增的 Mock 必須一致。
- REST 與 SOAP 新增或編輯的設定，以及新建/編輯的 Mock 回應預設為停用；需明確啟用後才能驗證。
- 如果輸入規格要求的行為超出動態註冊限制，先指出不相容處並列出可行選項，不要悄悄產生不同契約。
