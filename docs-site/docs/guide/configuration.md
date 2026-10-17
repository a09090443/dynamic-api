---
id: configuration
title: 設定參考
sidebar_label: 設定參考
---

# 設定參考

## 設定檔一覽

後端設定位於 `backend/src/main/resources/`：

| 檔案 | 內容 |
|---|---|
| `application.yml` | Spring Boot 主設定：context path、port、上傳大小、Flyway、CXF 路徑、Actuator |
| `resources.properties` | 日誌、JAR 存放目錄、WSDL 暫存目錄（由 `spring.config.import` 載入） |
| `data-source.properties` | SQLite 資料來源（由 `db-spring-boot-starter` 讀取） |
| `resources_{env}.properties`、`data-source_{env}.properties` | 各環境版本，`bootJar` 時依 `-Penv`（預設 `dev`）覆蓋上面兩個檔案 |
| `logback-spring.xml` | 日誌格式與輸出 |
| `db.migration/V*.sql` | Flyway 資料庫遷移腳本 |
| `sql/*.sql` | 程式使用的具名 SQL |

:::info `bootRun` 與 `bootJar` 用的設定不同
`bootRun` 直接讀取 `resources.properties`、`data-source.properties`；`bootJar` 會先把 `*_{env}.properties` 複製成上述檔名再打包。目前兩者的差異在 SQLite 檔名（`mockapi.db` vs `webservice.db`）與日誌目錄（`C:/tmp` vs `D:/tmp`）。
:::

## application.yml

| 設定鍵 | 預設值 | 說明 |
|---|---|---|
| `server.port` | `8080` | 服務埠 |
| `server.servlet.context-path` | `/dynamic-api` | 所有網址的前綴；前端生產建置的 `basePath` 也寫死為 `/dynamic-api`，兩者需一致 |
| `spring.servlet.multipart.max-file-size` / `max-request-size` | `100MB` | 上傳 JAR 的大小上限 |
| `spring.main.allow-bean-definition-overriding` | `true` | 允許重複註冊同名 Bean；Endpoint 重新啟用時會再次註冊同名 Bean，必須開啟 |
| `spring.flyway.locations` | `classpath:db.migration` | 遷移腳本位置 |
| `spring.jpa.properties.hibernate.dialect` | `SQLiteDialect` | SQLite 方言 |
| `web.service.uri-mapping` | `/webservice/*` | CXF Servlet 路徑，決定 SOAP 服務網址 `/dynamic-api/webservice/{publishUri}` |
| `web.service.map.*` | `example`、`user` | 隨後端一起發布的內建範例服務（`ExampleWebServiceImpl`、`ExampleUserServiceImpl`），非動態載入 |
| `management.endpoints.web.exposure.include` | `custom-api-mappings` | Actuator 開放清單（名稱與實際端點 id `show-mappings` 不符，見 [管理 RESTful](./restful.md#查看目前註冊的路由)） |

## resources.properties

| 設定鍵 | 預設值 | 說明 |
|---|---|---|
| `jar.file.dir` | `D:/tmp/` | 上傳 JAR 的存放目錄。**結尾必須有 `/`**，程式以字串直接串接檔名。 |
| `wsdl.objects.tmp.dir` | `D:/tmp/wsdl/` | WSDL 轉換暫存目錄，每次轉換完會整個刪除 |
| `log.base` | `C:/tmp` | 日誌目錄 |
| `log.moduleName` | `MockWebservice` | 日誌檔名前綴（`/common/logs/stream` 預設讀取 `MockWebservice.log`） |
| `log.root.level` | `DEBUG` | 根日誌等級 |
| `log.max.history` / `log.max.size` | `100` / `100MB` | 日誌保留天數與單檔大小 |

## data-source.properties

```properties
dynamic.primary=webservice
dynamic.entity-scan=com.dynamicapi
dynamic.is-encrypt=false
dynamic.data-source-map[webservice].url=jdbc:sqlite:D:/tmp/mockapi.db
dynamic.data-source-map[webservice].driverClassName=org.sqlite.JDBC
```

只需要調整 `url` 中的檔案路徑。SQLite 會自動建立資料庫檔案，但**所在目錄必須已存在**。

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
