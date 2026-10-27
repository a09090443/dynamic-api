---
id: troubleshooting
title: 疑難排解與已知問題
description: '日誌位置與即時串流，啟用失敗、呼叫 500、上傳 400、頁面 404 等常見問題的排查方式，以及已知問題一覽。'
sidebar_label: 疑難排解
---

# 疑難排解與已知問題

## 先看日誌

大多數錯誤在畫面上只會顯示簡短訊息，原因寫在後端日誌：

- 主控台輸出（`bootRun` 的終端機）
- 日誌檔：`{log.base}/MockWebservice.log`（預設 `C:/tmp` 或 `D:/tmp`，見 [設定參考](./configuration.md#resourcesproperties)）
- 即時串流：`GET /dynamic-api/common/logs/stream?logFileName=MockWebservice.log&tailLines=100`（Server-Sent Events，30 秒後自動斷線）

## 常見問題

### 啟動出現 RequestMappingHandlerMapping 的 Bean 歧義

若錯誤為 `DynamicControllerServiceImpl` 建構子找到 `requestMappingHandlerMapping` 與 `controllerEndpointHandlerMapping` 兩個候選，代表執行產物未包含明確的 Bean 選擇。程式已以 `@Qualifier("requestMappingHandlerMapping")` 指定 Spring MVC 的註冊器，請重新編譯後再啟動；IDE 若仍使用舊產物，執行 `Java: Clean Java Language Server Workspace` 並依提示重載。此修正不需要停用 Actuator，也不依賴建構子參數名稱。

### VS Code 或 Gradle 建置緩慢

若 F5 顯示工作區建置失敗，先查看 **Problems** 與 **Output → Language Support for Java**：

- 出現 `NoToolchainAvailableException` 時，確認 `.vscode/settings.json` 的 JDK 17 路徑符合本機環境，再重新匯入 Gradle 專案。
- 出現已不存在的 `redhat.java/<舊版本>/.../init.gradle` 時，表示匯入快取仍引用舊版擴充套件；執行 `Java: Clean Java Language Server Workspace` 並依提示重載。
- 修改 DAO 方法參數後，也要同步測試呼叫。`ResponseRepositoryTest` 的查詢已補上 `ServiceType.ENDPOINT`；可用 `.\gradlew.bat compileTestJava -x buildFrontend` 確認測試原始碼能編譯。僅執行 `classes` 不會檢查測試編譯。

先確認啟動的是哪一種建置：

| 入口 | 專案目前設定與影響 |
|---|---|
| VS Code 的 `java (build): Build Workspace` | `.vscode/tasks.json` 設定 `isFullBuild: true`，要求完整編譯工作區內的 Java 專案；範圍不限於 `backend/`。不能僅憑此設定推定它會執行 Gradle 的前端任務。 |
| Gradle 的 `build`、`bootJar`、`bootRun`、`test` | 需要處理後端資源的任務會經由 `processResources` 依賴 `buildFrontend`，連帶執行 `npm install`、`next build --turbopack`、清空並重新複製靜態資源。 |

目前 `installNextjs` 與 `buildNextjs` 都是未宣告輸入與輸出的 `Exec` 任務，因此重複建置仍會再次執行；`npm install` 不代表每次重新下載所有套件，但仍須檢查依賴。前端正式建置也會執行 TypeScript、ESLint 檢查與靜態匯出。

只改後端時，可在 `backend/` 執行：

```powershell
.\gradlew.bat bootRun -x buildFrontend
# 或只執行後端測試
.\gradlew.bat test -x buildFrontend
```

略過前端建置不會更新內嵌管理介面；前端開發請另跑 `npm run dev`，設定方式見 [安裝與啟動](./installation.md#方式二開發模式前端熱更新)。需要完整部署產物時，仍應執行包含前端的建置。

若要確認 Gradle 耗時位置，可在原本的建置命令加上 `--profile`，查看 `backend/build/reports/profile/` 的報表。VS Code 工作區編譯則需查看 Java／Gradle 的輸出紀錄，不能以 Gradle 任務設定直接判定瓶頸。

### 啟用 Endpoint / RESTful 失敗

| 日誌關鍵字 | 原因 | 處理 |
|---|---|---|
| `無法讀取 ClassPath` / `ClassNotFoundException` | Class 路徑打錯，或上傳的是 fat JAR（類別在 `BOOT-INF/classes/`） | 確認類別名稱；改上傳 `-plain.jar` |
| `路徑不一致` | RESTful 類別 `@RequestMapping` 第一段與 Publish URI 不同 | 把 Publish URI 改成相同值 |
| `找不到對應的 Jar 檔案` | 建立時沒有上傳 JAR，或 JAR 記錄已不存在 | 編輯並重新上傳 JAR |
| `NoClassDefFoundError` | JAR 用到後端沒有的第三方套件 | 見 [JAR 開發總覽](../jar-dev/overview.md#可以使用哪些套件) |
| `Web Service 註冊服務失敗`，原因為 Bean 衝突 | Bean 名稱與既有 Bean 相同 | 換一個 Bean 名稱 |
| JAR 檔不存在（`FileNotFoundException`） | 修改 Publish URI 時沒重新上傳 JAR，舊檔已被刪除 | 編輯並重新上傳 JAR |

### 呼叫服務得到 500

最常見的原因是**沒有命中任何 Mock 回應**，JAR 拿到空字串後解析失敗。依序檢查：

1. 回應的 **開關是否打開**（新增與編輯後都會變成停用）。
2. `method` 是否與 JAR 程式碼裡寫的一致。
3. `condition` 是否與 JAR 實際產生的字串**一字不差**。範例 RESTful JAR 會在日誌印出 `request json:{...}`，直接複製比對。
4. 回應是否建在正確的服務類型下（從 Endpoint 進去建的是 `ENDPOINT`，從 RESTful 進去建的是 `RESTFUL`）。

若命中了但仍是 500，通常是 **回應內容格式**與 JAR 期望的不符（例如 JSON 欄位名稱不同、SOAP XML 缺少 JAR 用來擷取的節點）。

### 上傳 JAR 回應 400

只接受副檔名為 `.jar` 且非空的檔案；檔案超過 100MB 也會被拒絕。

### 開發模式管理介面一直顯示錯誤／清單是空的

開發模式的 API 代理已被移除，請建立 `.env.local` 設定 `NEXT_PUBLIC_API_URL=http://localhost:8080`，詳見 [安裝與啟動](./installation.md#方式二開發模式前端熱更新)。

### 生產模式頁面 404

前端沒有被建置或複製進 `static/`。執行 `.\gradlew.bat clean bootJar`，確認日誌出現 `buildNextjs` 與「複製完成」訊息。

### Port 3000 已被占用

Next.js 開發模式與 Docusaurus 預設都用 3000，請以 `npm start -- --port 3001` 啟動文件網站。

## 已知問題一覽

以下是對照程式碼確認、目前尚未修正的問題：

| # | 問題 | 影響 | 暫時解法 |
|---|---|---|---|
| 1 | Next.js API 代理路由已刪除 | 前端開發模式無法呼叫後端 | `.env.local` 設 `NEXT_PUBLIC_API_URL=http://localhost:8080` |
| 2 | 修改 Publish URI 時會刪除舊 JAR 檔，即使新設定仍使用它 | 之後無法啟用 | 修改 Publish URI 時一併重新上傳 JAR |
| 3 | WSDL 工具 URL 模式送出 `wsdlPath`，後端讀 `wsdlUrl` | URL 模式無法使用 | 改用檔案模式或直接呼叫 API |
| 4 | Actuator 開放清單 `custom-api-mappings` 與端點 id `show-mappings` 不符 | 無法查詢動態路由 | 修改 `application.yml` |
| 5 | 前端建置任務寫死 Windows 版 Node | macOS / Linux 無法直接 `bootRun` | 見 [非 Windows 環境](./installation.md#非-windows-環境) |
| 6 | `test-api` 頁面呼叫 `/api/dynamic-api/ws/getEndpoints` | 該頁在兩種模式下都無法取得資料 | 不使用該頁 |
| 7 | 刪除 Endpoint / RESTful 不會刪除其 Mock 回應 | 資料殘留 | 需要時手動刪除回應 |
| 8 | 編輯 Mock 回應後會變成停用且 ID 改變 | 容易誤以為回應失效 | 編輯後重新啟用 |

設計層面的技術債與風險整理在 [SDD：設計決策與技術債](../sdd/decisions.md)。
