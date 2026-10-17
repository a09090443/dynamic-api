---
paths:
  - "backend/**"
---

# 後端（Spring Boot）建置與執行

## 常用命令（Windows；macOS / Linux 將 `.\gradlew.bat` 換成 `./gradlew`）

```powershell
cd backend
.\gradlew.bat bootRun                    # http://localhost:8080/dynamic-api/
.\gradlew.bat bootRun -x buildFrontend   # 只改後端時略過前端建置
.\gradlew.bat bootJar [-Penv=pro]        # build/libs/backend-0.0.1-SNAPSHOT.jar
.\gradlew.bat test
```

- `processResources` 依賴 `buildFrontend`，所以 `bootRun`／`bootJar` 每次都會先 `npm install` + `next build` 並複製到 `src/main/resources/static/`，第一次較久。
- 前端建置任務寫死 `tools/node-v22.20.0-win-x64/npm.cmd`，非 Windows 環境必須加 `-x buildFrontend`（前端需另外手動建置，見 `.claude/rules/frontend.md`）。
- `bootJar` 會依 `-Penv`（預設 `dev`）把 `*_{env}.properties` 覆蓋成正式檔名，見 `.claude/rules/configuration.md`。
- 測試很少（`ResponseRepositoryTest`、`DynamicControllerServiceTest`），動態載入相關修改需要以範例 JAR 手動驗證。

## 執行期的檔案

- 上傳的 JAR 存在**檔案系統** `jar.file.dir`（預設 `D:/tmp/`），檔名為 `{UUID}.jar`；資料庫 `JAR_FILE` 只存中繼資料，`STATUS` 為 `A`（使用中）／`I`（未使用）／`D`（已刪除，實體檔會被刪除）。
- SQLite 檔與日誌位置依執行方式不同，見 `.claude/rules/configuration.md`。所需目錄要事先存在。

## 目錄樹

`[rule]` 標示該處約定所在的規範檔；`(未使用)` 為目前沒有被引用的程式。

```
backend/
├── build.gradle                     # 相依套件、前端建置任務（installNextjs → buildNextjs → copyNextjsBuild）[frontend.md]
├── settings.gradle                  # rootProject.name = 'backend'（決定產物名稱 backend-0.0.1-SNAPSHOT.jar）
├── Dockerfile                       # 已過時：COPY 的檔名是 dynamic-api-0.0.1-SNAPSHOT.jar，與實際產物不符
├── docker-compose.yml               # 已過時：SPRING_DATASOURCE_URL 不會生效（資料來源由 dynamic.data-source-map 設定）
└── src/
    ├── main/java/com/dynamicapi/
    │   ├── Application.java
    │   ├── controller/              # 管理 API [management-api.md]
    │   │   ├── WebServiceController.java     # /ws：Endpoint 管理、genWsdlObj
    │   │   ├── DynamicLoadController.java    # /api：RESTful 管理
    │   │   └── CommonController.java         # /common：JAR 上傳、Mock 回應、日誌串流
    │   ├── service/
    │   │   ├── DynamicWebService.java、DynamicControllerService.java、CommonService.java
    │   │   └── impl/
    │   │       ├── BaseService.java                    # JAR 路徑與狀態更新（D 時刪檔）[dynamic-loading.md]
    │   │       ├── DynamicWebServiceImpl.java          # Endpoint 啟停、WSDL 轉換 [dynamic-loading.md]
    │   │       ├── DynamicControllerServiceImpl.java   # RESTful 載入與 RequestMapping 註冊 [dynamic-loading.md]
    │   │       └── CommonServiceImpl.java              # JAR 上傳、Mock 回應 CRUD、SSE 日誌 [mock-response.md]
    │   ├── util/
    │   │   ├── WebServiceHandler.java       # CXF 發布／撤銷 [dynamic-loading.md]
    │   │   ├── DynamicBeanUtil.java         # 動態註冊 Bean Definition
    │   │   ├── Wsdl2JavaUtil.java           # CXF WSDLToJava，輸出 ZIP
    │   │   ├── DynamicClassLoader.java      # (未使用)，實際使用 zipe 的 CustomClassLoader
    │   │   └── JsonToXmlTest.java           # (未使用) 實驗程式
    │   ├── setup/                   # SmartLifecycle：啟動時恢復已啟用服務 [dynamic-loading.md]
    │   │   ├── SetupWebservices.java
    │   │   └── SetupController.java
    │   ├── interceptor/             # Ignore CDATA 用的 CXF 攔截器 [dynamic-loading.md]
    │   ├── enums/
    │   │   ├── ClassLoaderSingletonEnum.java   # ClassLoader 登錄表 [dynamic-loading.md]
    │   │   ├── JarFileStatus.java              # A / I / D
    │   │   └── ServiceType.java                # ENDPOINT / RESTFUL [base-jar.md]
    │   ├── jarbase/                 # RestfulBase、WebserviceBase，與 base-jar 同步 [base-jar.md]
    │   ├── dao/MockResponseDao.java # 執行期 Mock 查詢，與 base-jar 同步 [base-jar.md]
    │   ├── jdbc/                    # BaseJDBCAdapter + *JDBC（SQL 名稱常數）[database.md]
    │   ├── repository/              # Spring Data JPA [database.md]
    │   ├── entity/                  # JPA 實體；MockResponseId 為複合主鍵 [database.md]
    │   ├── model/                   # 具名 SQL 查詢結果（WebServiceModel、ControllerModel）；User 僅供內建範例服務
    │   ├── converter/               # JarFileStatusConverter [database.md]
    │   ├── dto/                     # 請求／回應 DTO，需與前端 types 同步 [management-api.md]
    │   │                            #   MockResponseRequest、MockResponseResponse、WebServiceRequest 為 (未使用)
    │   ├── exception/               # WebserviceException、ControllerException、GlobalExceptionHandler [management-api.md]
    │   ├── config/
    │   │   ├── WebConfig.java                  # CORS、/ → index.html [frontend.md]
    │   │   ├── SpaController.java              # 前端頁面路由清單 [frontend.md]
    │   │   └── CustomApiMappingsEndpoint.java  # Actuator show-mappings
    │   └── webservice/              # 隨系統靜態發布的範例 SOAP 服務（web.service.map），非動態載入
    ├── main/resources/
    │   ├── application.yml                       [configuration.md]
    │   ├── resources*.properties、data-source*.properties  [configuration.md]
    │   ├── logback-spring.xml                    [configuration.md]
    │   ├── db.migration/V1.0～V1.2__*.sql        # Flyway，不可修改既有腳本 [database.md]
    │   ├── sql/SQL_*.sql                         # 具名 SQL，檔名 = *JDBC 常數 [database.md]
    │   ├── META-INF/spring.factories
    │   └── static/                               # 前端建置產物（建置時清空重建，不要手動修改）
    └── test/java/com/dynamicapi/
        ├── jarbase/TestBase.java
        ├── repository/ResponseRepositoryTest.java
        └── service/DynamicControllerServiceTest.java
```

新增類別時放在既有的對應套件；新增「被使用者 JAR 依賴」的類別時，放在 `jarbase/` 或 `dao/` 並同步到 `base-jar/`。
