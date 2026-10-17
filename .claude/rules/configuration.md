---
paths:
  - "backend/src/main/resources/*.properties"
  - "backend/src/main/resources/application.yml"
  - "backend/src/main/resources/logback-spring.xml"
  - "nextjs-dynamic-api-manager/.env*"
---

# 環境設定檔

設定說明：`docs-site/docs/guide/configuration.md`。

## 多環境檔要一起改

| 基本檔（`bootRun` 使用） | 環境檔（`bootJar -Penv=<env>` 時覆蓋基本檔） |
|---|---|
| `resources.properties` | `resources_dev.properties`、`resources_pro.properties` |
| `data-source.properties` | `data-source_dev.properties`、`data-source_pro.properties` |

新增或改名設定鍵時，三個檔案都要加；只改值時確認是否所有環境都需要。`bootJar` 的預設 `env` 是 `dev`。

## 目前的檔案位置

| 項目 | `bootRun`（基本檔） | `bootJar`（預設 `env=dev`） |
|---|---|---|
| SQLite | `D:/tmp/mockapi.db` | `D:/tmp/webservice.db` |
| 日誌 `log.base` | `C:/tmp` | `D:/tmp` |
| 上傳 JAR `jar.file.dir` | `D:/tmp/` | `D:/tmp/` |

日誌檔名為 `{log.base}/MockWebservice.log`（另有 `_err.log`、`_print.log`）。這些目錄需事先存在（SQLite 不會建立目錄）。

## 不可破壞的值

- `jar.file.dir`、`wsdl.objects.tmp.dir` 結尾必須有 `/`（程式直接字串串接檔名）。
- `wsdl.objects.tmp.dir` 每次轉換後會被**整個刪除**，不可指向含有其他檔案的目錄。
- `server.servlet.context-path: /dynamic-api` 與前端 `next.config` 的 `basePath`、前端 services 的 `BASE_PATH` 綁定，改動需三處同步。
- `web.service.uri-mapping: /webservice/*` 決定 SOAP 服務網址，文件與 Postman 集合大量引用。
- `spring.main.allow-bean-definition-overriding: true` 是 Endpoint 重新啟用的必要條件。
- `spring.flyway.locations: classpath:db.migration`。
- `log.moduleName` 決定日誌檔名，`/common/logs/stream` 預設讀 `MockWebservice.log`。
- SQLite 的資料庫檔案所在目錄必須已存在。

## 前端 `.env*`

- `.env.development`、`.env.production` 進版控；個人設定放 `.env.local`（不進版控）。
- `NEXT_PUBLIC_*` 會打包進前端，不可放機密。

## 變更後

設定鍵或預設值有變時，更新 `docs-site/docs/guide/configuration.md`；路徑類預設值也出現在 `docs-site/docs/guide/installation.md`。
