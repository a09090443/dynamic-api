# AGENTS.md

給 AI coding agent（Codex、Claude Code 等）的專案導覽。本檔只放地圖；細節在下方連結的規範檔與文件網站。

## 專案概述

Dynamic API Manager 是一套 Mock API 伺服器：在執行期從上傳的 JAR 動態發布 SOAP Web Service（Apache CXF）與 Spring `@RestController`，不需重啟；服務被呼叫時，JAR 程式以 `publishUri`、`method`、`condition` 從 SQLite 查出預設的回應內容。

## 回答功能問題的流程（必須遵守）

凡是詢問系統功能、行為、用法的問題：

1. **先查文件**：從 `docs-site/docs/` 找出相關內容（入口見下表）。
2. **再確認程式**：對照文件描述的行為，閱讀對應程式碼驗證。
3. **不一致時以程式為準**：回答時依程式碼的實際行為，並說明文件哪裡與程式不符。
4. **一定要修正文件**：在同一次工作中更新 `docs-site/` 的對應頁面（含已知問題、技術債清單等引用處），並執行 `cd docs-site && npm run build` 確認建置成功。若程式行為明顯是錯誤，文件照實記錄為「已知問題」，不要寫成預期行為；是否修改程式需另外徵詢使用者。

## 修改程式時的文件同步（必須遵守）

任何程式修改（新功能、修 bug、重構、設定或建置變更）在結束前都要：

1. **依下表找出受影響的文件頁**，逐頁確認內容與修改後的程式一致；不一致就在同一次工作中更新。
2. **修正了已知問題或技術債**時，從 `KI-*`／`TD-*` 清單移除（編號不重用），並在 SRS／SDD 的變更紀錄註記；同時清掉其他頁面對它的引用。
3. 執行 `cd docs-site && npm run build`，必須成功。
4. 回報時列出更新了哪些文件頁；若判斷不需要更新，說明理由。

| 修改的程式 | 要檢查的文件（`docs-site/docs/` 下） |
|---|---|
| 管理 API（`controller/`、`dto/`、前端 `services/`、`types/`） | `sdd/api/*`、`guide/` 對應操作頁、`srs/functional/*` |
| 動態載入（`util/`、`service/impl/Dynamic*`、`setup/`、`interceptor/`） | `sdd/dynamic-loading.md`、`sdd/workflows.md`、`guide/endpoint.md`、`guide/restful.md`、`guide/troubleshooting.md` |
| Mock 回應（`CommonServiceImpl`、`dao/`、相關 SQL） | `sdd/mock-engine.md`、`guide/mock-response.md`、`srs/functional/mock-response.md` |
| `jarbase/`、`base-jar/` | `jar-dev/base-jar.md`、`jar-dev/overview.md` |
| 資料表、遷移、實體 | `sdd/data.md`、`srs/data-rules.md` |
| 前端頁面與元件 | `sdd/frontend.md`、`guide/` 對應操作頁 |
| 設定檔、`build.gradle`、Docker | `guide/configuration.md`、`guide/installation.md`、`sdd/deployment.md` |
| 範例 JAR（`endpoints/`、`restfuls/`） | `guide/quick-start.md`、`jar-dev/*`，以及範例專案的 README |
| 任何已列為 `KI-*`／`TD-*` 的行為 | `guide/troubleshooting.md`、`srs/acceptance.md`、`sdd/decisions.md` |

文件入口：

| 需要了解 | 文件 |
|---|---|
| 操作方式、設定、已知問題 | `docs-site/docs/guide/` |
| 自訂 JAR 的寫法 | `docs-site/docs/jar-dev/` |
| 需求編號（`FR-*`、`KI-*`） | `docs-site/docs/srs/` |
| 架構、動態載入、資料表、管理 API、技術債（`TD-*`） | `docs-site/docs/sdd/` |

## 編輯前必讀的規範

規範檔放在 `.claude/rules/`（一般 Markdown，任何工具皆可直接閱讀；檔頭的 `paths` 是 Claude Code 的自動載入設定）。**修改下列路徑前，先讀對應的規範檔**：

| 修改的路徑 | 先讀 |
|---|---|
| `backend/**`（建置、執行、套件對照） | `.claude/rules/backend.md` |
| `backend/.../util/WebServiceHandler.java`、`service/impl/Dynamic*`、`setup/`、`enums/ClassLoaderSingletonEnum.java`、`interceptor/` | `.claude/rules/dynamic-loading.md` |
| `base-jar/**`、`backend/.../jarbase/`、`dao/`、`jdbc/BaseJDBCAdapter.java`、`jdbc/MockResponseJDBC.java`、`enums/ServiceType.java` | `.claude/rules/base-jar.md` |
| `backend/.../resources/db.migration/`、`resources/sql/`、`entity/`、`repository/`、`jdbc/`、`model/`、`converter/` | `.claude/rules/database.md` |
| `backend/.../controller/`、`dto/`、`exception/`、`nextjs-dynamic-api-manager/src/services/`、`src/types/` | `.claude/rules/management-api.md` |
| `backend/.../service/impl/CommonServiceImpl.java`、Mock 回應實體與 SQL、`nextjs-dynamic-api-manager/src/app/response/` | `.claude/rules/mock-response.md` |
| `nextjs-dynamic-api-manager/**`、`backend/build.gradle`、`config/SpaController.java`、`config/WebConfig.java` | `.claude/rules/frontend.md` |
| `backend/src/main/resources/*.properties`、`application.yml`、`logback-spring.xml`、`nextjs-dynamic-api-manager/.env*` | `.claude/rules/configuration.md` |
| `endpoints/**`、`restfuls/**` | `.claude/rules/sample-jars.md` |
| `docs-site/**` | `.claude/rules/docs-site.md` |

（`backend/...` 代表 `backend/src/main/java/com/dynamicapi/`）

## 模組

| 目錄 | 說明 |
|---|---|
| `backend/` | Spring Boot 3.2.5（Java 17）。動態載入、管理 API、內嵌 SQLite + Flyway |
| `nextjs-dynamic-api-manager/` | 管理介面，Next.js 15.5.4 + MUI 7；生產模式靜態匯出並打包進後端 |
| `base-jar/` | 提供 `RestfulBase`、`WebserviceBase`、`MockResponseDao` 給自訂 JAR 編譯用（與後端同名類別必須一致） |
| `endpoints/`、`restfuls/` | 自訂 JAR 範例（`company-endpoint`、`company-restful`、`example-restful`） |
| `docs-site/` | 文件網站（Docusaurus） |
| `postman/` | 管理 API 與 SOAP 呼叫範例集合 |
| `frontend/` | 舊版 Angular 管理介面，已不使用，不要修改 |
| `docs/` | 舊版單檔 SRS / SDD，內容已過時，以 `docs-site/` 為準 |
| `tools/` | Gradle 前端建置使用的 Windows 版 Node.js 22，不要修改 |

## 常用命令（Windows；macOS / Linux 用 `./gradlew`）

| 目的 | 命令 |
|---|---|
| 啟動後端（含前端建置） | `cd backend && .\gradlew.bat bootRun` → `http://localhost:8080/dynamic-api/` |
| 只改後端、略過前端建置 | `.\gradlew.bat bootRun -x buildFrontend`（非 Windows 必須加） |
| 後端測試 | `cd backend && .\gradlew.bat test` |
| 前端檢查 | `cd nextjs-dynamic-api-manager && npm run type-check && npm run lint` |
| 文件網站驗證 | `cd docs-site && npm run build` |
| 範例 JAR | `.\gradlew.bat jar`，上傳 `build/libs/*-plain.jar`（需要 JDK 17） |

## 架構速覽

```
管理介面 ──▶ Controller（/ws /api /common）──▶ Service ──▶ SQLite / jar.file.dir
                                               │
                                               ▼
                         WebServiceHandler（CXF 發布）／RequestMappingHandlerMapping（動態註冊）
                                               │  每個服務一個 CustomClassLoader（父優先）
                                               ▼  登錄於 ClassLoaderSingletonEnum
                                   使用者 JAR 類別 ──▶ findByPrimaryKey ──▶ MOCK_RESPONSE
```

- 網址：SOAP `/dynamic-api/webservice/{publishUri}`、RESTful `/dynamic-api/{publishUri}/...`、管理 API `/dynamic-api/ws`、`/api`、`/common`。
- Mock 回應以 `(PUBLISH_URI, METHOD, CONDITION, SERVICE_TYPE)` 完全相等且啟用才命中；`method`、`condition` 由 JAR 程式決定。
- Endpoint、RESTful、Mock 回應新建或編輯後一律為**停用**。
- 管理 API 回傳 `{code, message, data}`；驗證失敗是 HTTP 200 + `code=400`。
- 系統沒有認證機制，只能部署在受信任的內部網路。

## 修改時的程式連動

文件的同步見上方「修改程式時的文件同步」；本表列的是程式之間的連動。

| 改了 | 也要改 |
|---|---|
| 後端 DTO 或管理 API | 前端 `src/types/`、`src/services/`；`docs-site/docs/sdd/api/` |
| `backend` 的 `jarbase/`、`dao/`、相關 `jdbc/` | `base-jar/` 同名類別 |
| 資料表 | 新增 `db.migration/V1.3__*.sql`（不可修改既有腳本）；`docs-site/docs/sdd/data.md` |
| 新增前端頁面 | `backend/build.gradle` 的 `copyNextjsBuild` 頁面清單、`config/SpaController` |
| `*.properties` 設定鍵 | 同組的 `_dev`、`_pro` 版本；`docs-site/docs/guide/configuration.md` |

## 維護本檔

本檔是各工具共用的唯一入口，保持精簡（約 100 行）。細節寫進 `.claude/rules/` 的對應規範檔或 `docs-site/`；新增規範檔時，同步更新上方「編輯前必讀的規範」表。
