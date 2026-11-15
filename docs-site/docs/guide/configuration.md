---
id: configuration
title: 設定參考
description: '後端 application.yml、resources.properties、data-source.properties 與前端環境變數的設定鍵、預設值，以及 CORS 設定。'
sidebar_label: 設定參考
---

# 設定參考

## 設定檔一覽

後端設定位於 `backend/src/main/resources/`：

| 檔案 | 內容 |
|---|---|
| `application.yml` | Spring Boot 主設定：context path、port、上傳大小、Flyway、CXF 路徑、Actuator |
| `resources.properties` | 日誌、JAR 存放目錄、WSDL 暫存目錄（由 `spring.config.import` 載入） |
| `data-source.properties` | 資料來源與資料庫選擇（預設 SQLite，可選 PostgreSQL；由 `db-spring-boot-starter` 讀取） |
| `resources_{env}.properties`、`data-source_{env}.properties` | 各環境版本，`bootJar` 時依 `-Penv`（預設 `dev`）覆蓋上面兩個檔案 |
| `logback-spring.xml` | 日誌格式與輸出 |
| `db.migration/V*.sql` | Flyway 資料庫遷移腳本（SQLite） |
| `db.postgresql/V*.sql` | Flyway 資料庫遷移腳本（PostgreSQL，只在切換 PostgreSQL 時執行） |
| `sql/*.sql` | 程式使用的具名 SQL |

:::info `bootRun` 與 `bootJar` 用的設定不同
`bootRun` 直接讀取 `resources.properties`、`data-source.properties`；`bootJar` 會先把 `*_{env}.properties` 複製成上述檔名再打包。目前兩者唯一的差異是 SQLite 檔名（`/tmp/mockapi.db` vs `/tmp/webservice.db`），日誌、上傳 JAR 與 WSDL 暫存目錄都在 `/tmp` 底下。
:::

:::warning 預設路徑是 Linux 的 `/tmp`
所有預設路徑都放在 `/tmp`：SQLite、上傳的 JAR、WSDL 暫存與日誌。`/tmp` 在部分 Linux 發行版重開機或系統清理時會被清空，資料庫與已上傳的 JAR 會一起消失；**正式使用請改到權限適當的持久目錄**（例如 `/var/lib/dynamic-api/`），或用下方「[執行期覆寫](#執行期覆寫與-docker-compose)」在啟動時指定。

**Windows 使用者升級後**，預設路徑已不再是 `C:/tmp`、`D:/tmp`，請擇一處理，否則會找不到原本的資料庫與 JAR 目錄：

- 修改實際使用的設定檔：`bootRun` 改 `resources.properties`、`data-source.properties`；`bootJar` 改所選 `-Penv` 的 `resources_{env}.properties`、`data-source_{env}.properties`。例如 `jar.file.dir = D:/tmp/`、`wsdl.objects.tmp.dir = D:/tmp/wsdl/`、`log.base = D:/tmp`、`dynamic.data-source-map[webservice].url=jdbc:sqlite:D:/tmp/webservice.db`。
- 或不改檔案，啟動時以命令列參數覆寫（設定鍵同下方範例，路徑換成 Windows 路徑）。
:::

後端測試另有 `backend/src/test/resources/` 下的 `resources.properties` 與 `data-source.properties`，只在測試時取代正式檔，所有路徑都指向 `backend/build/` 底下的相對路徑（`build/test-logs`、`build/test-jars/`、`build/test-wsdl/`、`build/dynamic-api-test.db`），不需要事先建立 `/tmp` 目錄。

## application.yml

| 設定鍵 | 預設值 | 說明 |
|---|---|---|
| `server.port` | `8080` | 服務埠 |
| `server.servlet.context-path` | `/dynamic-api` | 所有網址的前綴；前端生產建置的 `basePath` 也寫死為 `/dynamic-api`，兩者需一致 |
| `spring.servlet.multipart.max-file-size` / `max-request-size` | `100MB` | 上傳 JAR 的大小上限 |
| `spring.main.allow-bean-definition-overriding` | `true` | 允許重複註冊同名 Bean；Endpoint 重新啟用時會再次註冊同名 Bean，必須開啟 |
| `spring.flyway.locations` | `${app.database.flyway-locations:classpath:db.migration}` | 遷移腳本位置，由 `data-source*.properties` 的 `app.database.flyway-locations` 決定；未設定時為 SQLite 的 `classpath:db.migration` |
| `spring.jpa.properties.hibernate.dialect` | `${app.database.dialect:org.hibernate.community.dialect.SQLiteDialect}` | Hibernate 方言，由 `app.database.dialect` 決定；未設定時為 `SQLiteDialect` |
| `web.service.uri-mapping` | `/webservice/*` | CXF Servlet 路徑，決定 SOAP 服務網址 `/dynamic-api/webservice/{publishUri}` |
| `web.service.map.*` | `example`、`user` | 隨後端一起發布的內建範例服務（`ExampleWebServiceImpl`、`ExampleUserServiceImpl`），非動態載入 |
| `management.endpoints.web.exposure.include` | `custom-api-mappings` | Actuator 開放清單（名稱與實際端點 id `show-mappings` 不符，見 [管理 RESTful](./restful.md#查看目前註冊的路由)） |

## resources.properties

| 設定鍵 | 預設值 | 說明 |
|---|---|---|
| `jar.file.dir` | `/tmp/` | 上傳 JAR 的存放目錄。**結尾必須有 `/`**，程式以字串直接串接檔名。 |
| `wsdl.objects.tmp.dir` | `/tmp/wsdl/` | WSDL 轉換暫存目錄，每次轉換完會整個刪除 |
| `log.base` | `/tmp` | 日誌目錄 |
| `log.moduleName` | `MockWebservice` | 日誌檔名前綴（`/common/logs/stream` 預設讀取 `MockWebservice.log`） |
| `log.root.level` | `DEBUG` | 根日誌等級 |
| `log.max.history` / `log.max.size` | `100` / `100MB` | 日誌保留天數與單檔大小 |

## data-source.properties

```properties
dynamic.primary=webservice
dynamic.entity-scan=com.dynamicapi
dynamic.is-encrypt=false
dynamic.data-source-map[webservice].url=jdbc:sqlite:/tmp/mockapi.db
dynamic.data-source-map[webservice].driverClassName=org.sqlite.JDBC
app.database.dialect=org.hibernate.community.dialect.SQLiteDialect
app.database.flyway-locations=classpath:db.migration
```

`data-source_dev.properties`、`data-source_pro.properties`（`bootJar` 使用）的 `url` 為 `jdbc:sqlite:/tmp/webservice.db`。只需要調整 `url` 中的檔案路徑。SQLite 會自動建立資料庫檔案，但**所在目錄必須已存在**。

`app.database.dialect`、`app.database.flyway-locations` 決定 Hibernate 方言與 Flyway 腳本位置，三份 `data-source*.properties` 使用相同鍵名。沒有設定這兩個鍵時（例如舊版設定檔或測試設定），系統回退為 SQLite（`SQLiteDialect` 與 `classpath:db.migration`），既有 SQLite 使用者不需修改任何設定。

### 切換到 PostgreSQL（可選） {#切換到-postgresql可選}

:::warning 尚未在實際 PostgreSQL 環境驗證
PostgreSQL 支援目前只完成設定、相依套件與建表腳本，並以 SQLite 回歸測試確認既有行為不受影響；**尚未在實際的 PostgreSQL 伺服器上驗證**連線、Flyway 建表與 Mock 命中。正式使用前請先在測試環境確認。
:::

- **預設是 SQLite**，不做任何設定就維持原本行為。
- **最低支援版本**：PostgreSQL 12，建議 14 以上（依 Hibernate 6.4 `PostgreSQLDialect` 與 Flyway 10 社群版的支援範圍訂定）。
- **資料庫需事先建立**（例如 `CREATE DATABASE dynamic_api;`），連線帳號要有目標 schema 的建表權限。PostgreSQL 15 起 `public` schema 預設不再開放一般使用者 `CREATE`，需另外授權或使用帳號擁有的 schema。
- 本系統不提供從 SQLite 搬移既有資料到 PostgreSQL 的工具；切換後是一個空的資料庫。

在實際使用的設定檔（`bootRun` 改 `data-source.properties`；`bootJar` 改所選 `-Penv` 的 `data-source_{env}.properties`）中，把 SQLite 區塊（`url`、`username`、`pa55word`、`driverClassName` 與兩個 `app.database.*`）註解掉，再取消檔案下方 PostgreSQL 區塊的註解，並把佔位值換成實際值：

```properties
dynamic.data-source-map[webservice].name=webservice
dynamic.data-source-map[webservice].url=jdbc:postgresql://localhost:5432/dynamic_api
dynamic.data-source-map[webservice].username=your_username
dynamic.data-source-map[webservice].pa55word=your_password
dynamic.data-source-map[webservice].driverClassName=org.postgresql.Driver
app.database.dialect=org.hibernate.dialect.PostgreSQLDialect
app.database.flyway-locations=classpath:db.postgresql
```

這七個鍵必須整組切換；只改 `url` 而沒改方言或 Flyway 位置，會讓 PostgreSQL 執行 SQLite 的遷移腳本而失敗。帳號密碼不要提交進版控，可改用下方的命令列參數在啟動時提供。腳本位置與型別對應見 [資料設計](../sdd/data.md#postgresql-遷移腳本)。

與 SQLite 的行為差異：

- PostgreSQL 會強制 `VARCHAR` 長度（例如 `PUBLISH_URI` 最多 100 字、`METHOD` 最多 50 字），超過時新增或修改會失敗；SQLite 不檢查長度。
- `CONDITION` 是 `MOCK_RESPONSE` 主鍵的一部分，PostgreSQL 的 btree 索引單筆上限約 2.7KB，條件字串過長時新增 Mock 回應會失敗。
- `CREATED_AT`、`UPDATED_AT` 仍為 `TEXT`（與 SQLite 相同，TD-09 未修正）。

### 執行期覆寫與 Docker Compose

`db-spring-boot-starter` 以 `@PropertySource` 載入打包在 JAR 內的 `data-source.properties`，再以 `@ConfigurationProperties(prefix = "dynamic")` 綁定。Spring Boot 命令列屬性的優先序高於 `@PropertySource`，因此可以在啟動時用完整設定鍵覆寫資料庫路徑；`jar.file.dir` 與 `log.base` 也可用同樣方式覆寫：

```bash
java -jar backend-0.0.1-SNAPSHOT.jar \
  '--dynamic.data-source-map[webservice].url=jdbc:sqlite:/data/sqlite/webservice.db' \
  --jar.file.dir=/data/jars/ \
  --log.base=/data/logs
```

`backend/docker-compose.yml` 使用這組命令列參數，並將 `/data/sqlite`、`/data/jars`、`/data/logs` 分別掛載到具名 volume。`jar.file.dir` 的尾端 `/` 不可省略；三個容器目錄由映像預先建立。

## Swagger UI 與 OpenAPI

動態 RESTful 服務的 OpenAPI 文件（`/dynamic-api/api/getOpenApi`）與 Swagger UI（`/dynamic-api/swagger-ui.html`）**不需要額外設定鍵**，也沒有開關：文件每次請求依目前已啟用的 RESTful 服務即時產生，`servers` 取自 `server.servlet.context-path`。Swagger UI 的靜態資源來自 `backend/build.gradle` 的 `org.webjars:swagger-ui` 相依。用法見 [管理 RESTful](./restful.md#swagger-uiopenapi-文件)。

## 前端環境變數

位於 `nextjs-dynamic-api-manager/`：

| 變數 | `.env.development` | `.env.production` | 說明 |
|---|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:3000/api` | `/dynamic-api` | 管理 API 的基底網址。生產模式下，只要頁面不是從 `:3000` 開啟，程式就改用相對路徑。 |
| `BACKEND_API_URL` | `http://localhost:8080` | `http://localhost:8080` | 原供 API 代理路由使用（該路由已移除） |
| `NEXT_PUBLIC_APP_NAME` | — | — | 畫面顯示名稱 |
| `NEXT_PUBLIC_DEBUG_MODE` | `true` | `false` | 在瀏覽器 console 輸出 API 呼叫紀錄 |
| `NEXT_PUBLIC_API_TIMEOUT` | 未設定（10000） | 未設定（10000） | API 逾時毫秒數 |

本機覆寫請建立 `.env.local`（不會進版控），開發模式的建議值見 [安裝與啟動](./installation.md#方式二開發模式前端熱更新)。

## CORS

`WebConfig` 對所有路徑允許來源 `http://localhost:3000`（Next.js 開發模式），三個管理 Controller 另外以 `@CrossOrigin` 允許 `http://localhost:4200`（舊版 Angular 前端）。若管理介面部署在其他網域，需要修改 `WebConfig.addCorsMappings`。
