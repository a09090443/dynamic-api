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

新增或改名設定鍵時，三個檔案都要加；只改值時確認是否所有環境都需要。資料庫切換用的 `app.database.dialect`、`app.database.flyway-locations` 與 `dynamic.data-source-map[webservice].*` 也必須在三份 `data-source*.properties` 使用相同鍵名與成組設定。`bootJar` 的預設 `env` 是 `dev`。

## 目前的檔案位置

| 項目 | `bootRun`（基本檔） | `bootJar`（預設 `env=dev`） |
|---|---|---|
| SQLite | `/tmp/mockapi.db` | `/tmp/webservice.db` |
| 日誌 `log.base` | `/tmp` | `/tmp` |
| 上傳 JAR `jar.file.dir` | `/tmp/` | `/tmp/` |
| WSDL 暫存 `wsdl.objects.tmp.dir` | `/tmp/wsdl/` | `/tmp/wsdl/` |

日誌檔名為 `{log.base}/MockWebservice.log`（另有 `_err.log`、`_print.log`）。這些目錄需事先存在（SQLite 不會建立目錄）。PostgreSQL 則必須先建立資料庫，並讓連線帳號具備目標 schema 的建表權限。

`/tmp` 可能在 Linux 重開機或系統清理時被清除。正式環境應將 SQLite、JAR、WSDL 暫存與日誌改到權限適當的持久目錄。Windows 使用者升級後也必須在實際使用的 `resources*.properties` 與 `data-source*.properties` 覆寫為有效的 Windows 路徑；`bootRun` 修改基本檔，`bootJar` 則同步修改所選 `-Penv` 的環境檔。

## 不可破壞的值

- `jar.file.dir`、`wsdl.objects.tmp.dir` 結尾必須有 `/`（程式直接字串串接檔名）。
- `wsdl.objects.tmp.dir` 每次轉換後會被**整個刪除**，不可指向含有其他檔案的目錄。
- `server.servlet.context-path: /dynamic-api` 與前端 `next.config` 的 `basePath`、前端 services 的 `BASE_PATH` 綁定，改動需三處同步。
- `web.service.uri-mapping: /webservice/*` 決定 SOAP 服務網址，文件與 Postman 集合大量引用。
- `spring.main.allow-bean-definition-overriding: true` 是 Endpoint 重新啟用的必要條件。
- `spring.jpa.properties.hibernate.dialect` 與 `spring.flyway.locations` 分別由 `app.database.dialect`、`app.database.flyway-locations` 控制；未設定時必須回退到 SQLite 的 `org.hibernate.community.dialect.SQLiteDialect` 與 `classpath:db.migration`。
- 切換 PostgreSQL 時，資料來源 URL、帳號、密碼、driver、方言與 Flyway 位置必須整組切換：driver 使用 `org.postgresql.Driver`、方言使用 `org.hibernate.dialect.PostgreSQLDialect`、Flyway 位置使用 `classpath:db.postgresql`。範例帳密只能使用空值或明顯的佔位文字，不可放真實憑證。
- `log.moduleName` 決定日誌檔名，`/common/logs/stream` 預設讀 `MockWebservice.log`。
- SQLite 的資料庫檔案所在目錄必須已存在。

## 前端 `.env*`

- `.env.development`、`.env.production` 進版控；個人設定放 `.env.local`（不進版控）。
- `NEXT_PUBLIC_*` 會打包進前端，不可放機密。

## 變更後

設定鍵或預設值有變時，更新 `docs-site/docs/guide/configuration.md`；路徑類預設值也出現在 `docs-site/docs/guide/installation.md`。資料庫切換說明須明示預設仍為 SQLite，且 PostgreSQL 支援尚未在實際 PostgreSQL 環境驗證。
