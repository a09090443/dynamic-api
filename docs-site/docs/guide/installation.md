---
id: installation
title: 安裝與啟動
description: '環境需求、資料目錄準備，以及生產模式、開發模式、文件網站三種啟動方式，含 Port 一覽與非 Windows 環境說明。'
sidebar_label: 安裝與啟動
---

# 安裝與啟動

## 環境需求

| 項目 | 版本 | 備註 |
|---|---|---|
| JDK | 17 以上 | `backend/build.gradle` 設定 `sourceCompatibility = '17'` |
| Node.js | 22 | Windows 上 Gradle 會使用專案內附的 `tools/node-v22.20.0-win-x64`；手動跑前端開發模式時需自行安裝 |
| Gradle | 不需安裝 | 各模組都附 Gradle Wrapper |
| 作業系統 | Windows（建議） | 見下方「非 Windows 環境」 |

## 啟動前：確認檔案存放目錄

預設設定把資料檔放在固定的 Windows 路徑，第一次啟動前請確認目錄存在，或改成你要的路徑（見 [設定參考](./configuration.md)）：

| 用途 | 設定鍵 | 預設值 |
|---|---|---|
| SQLite 資料庫 | `dynamic.data-source-map[webservice].url` | `jdbc:sqlite:D:/tmp/mockapi.db`（`bootRun`）<br/>`jdbc:sqlite:D:/tmp/webservice.db`（`bootJar`） |
| 上傳的 JAR | `jar.file.dir` | `D:/tmp/` |
| WSDL 轉換暫存 | `wsdl.objects.tmp.dir` | `D:/tmp/wsdl/` |
| 日誌 | `log.base` | `C:/tmp`（`bootRun`）／`D:/tmp`（`bootJar`） |

資料表會在啟動時由 Flyway 自動建立，不需要手動執行 SQL。

## 方式一：生產模式（單一服務，建議先用這個）

前後端整合成單一 Spring Boot 應用，只需開一個服務。

```powershell
cd backend
.\gradlew.bat bootRun
```

`bootRun` / `bootJar` 會先自動執行前端建置：`npm install` → `next build --turbopack`（靜態匯出）→ 複製到 `backend/src/main/resources/static/`。目前 `installNextjs` 與 `buildNextjs` 未宣告增量建置所需的輸入與輸出，每次執行這條任務鏈都會再次執行安裝檢查與前端建置，不只第一次可能需要數分鐘。僅開發後端時可使用 `.\gradlew.bat bootRun -x buildFrontend`；詳見 [建置緩慢排查](./troubleshooting.md#vs-code-或-gradle-建置緩慢)。

啟動後開啟：**http://localhost:8080/dynamic-api/**

若要產出可部署的 JAR：

```powershell
cd backend
.\gradlew.bat bootJar
java -jar build\libs\backend-0.0.1-SNAPSHOT.jar
```

:::tip 指定環境
`bootJar` 會把 `resources_{env}.properties` 與 `data-source_{env}.properties` 覆蓋為正式設定，預設 `env=dev`。要使用 `pro` 設定：`.\gradlew.bat bootJar -Penv=pro`。
:::

### 使用 Docker Compose 部署

Compose 只封裝已建好的 JAR，不會在容器內編譯後端或管理介面。先在主機建立 `backend-0.0.1-SNAPSHOT.jar`，再建置並啟動容器：

```powershell
cd backend
.\gradlew.bat bootJar -Penv=pro
docker compose up --build -d
```

macOS / Linux 上必須使用 `gradle bootJar -x buildFrontend`（或 `./gradlew bootJar -x buildFrontend`）；這樣產出的 JAR **不含最新的管理介面**。若部署需要管理介面，須先依本頁的[非 Windows 環境](#非-windows-環境)步驟手動建置並複製前端，再建立 JAR。

Compose 會以 Spring Boot 命令列屬性把 SQLite、上傳 JAR 與日誌分別指向容器內的 `/data/sqlite`、`/data/jars/`、`/data/logs`，並使用 `sqlite-data`、`uploaded-jars`、`application-logs` 三個具名 volume 保存。一般 `docker compose down` 會保留資料；`docker compose down -v` 會刪除三個 volume，執行前必須備份 SQLite 與 JAR 目錄。回滾映像時也要保留相同 volume，並先備份資料庫。

系統沒有認證機制，只能部署在受信任的內部網路。啟動後以本頁的[確認服務正常](#確認服務正常)請求檢查應用與資料庫；目前 Compose 未宣告容器健康檢查。

## 方式二：開發模式（前端熱更新）

適合修改管理介面時使用，需同時啟動後端與前端。

```powershell
# 終端機 1：後端
cd backend
.\gradlew.bat bootRun -x buildFrontend

# 終端機 2：前端
cd nextjs-dynamic-api-manager
npm install   # 第一次
npm run dev
```

開啟：**http://localhost:3000/endpoint**

:::warning 已知問題：開發模式的 API 代理已被移除
`.env.development` 設定 `NEXT_PUBLIC_API_URL=http://localhost:3000/api`，原本靠 Next.js API Route（`src/app/api/dynamic-api/[...path]/route.ts`）轉送到後端，但該檔案已在 commit `28f109c` 被刪除，因此開發模式下的 API 呼叫會得到 404。

**暫時解法**：在 `nextjs-dynamic-api-manager/` 建立 `.env.local`，讓前端直接呼叫後端（後端 CORS 已允許 `http://localhost:3000`）：

```properties title="nextjs-dynamic-api-manager/.env.local"
NEXT_PUBLIC_API_URL=http://localhost:8080
```
:::

## VS Code 執行與偵錯後端

1. 開啟專案根目錄，安裝 Microsoft 的 **Extension Pack for Java**。
2. 在 `.vscode/settings.json` 確認 `java.configuration.runtimes` 的 `JavaSE-17` 路徑，以及 `java.import.gradle.java.home`，皆指向本機 JDK 17。儲存庫目前使用 `D:/tools/openlogic-openjdk-17.0.14+7-windows-x64`，其他電腦需調整。Java 語言伺服器可繼續使用擴充套件內附的 JRE。
3. 執行命令面板的 `Developer: Reload Window`，等待 Java 專案匯入完成。若仍保留先前的匯入錯誤，可執行 `Java: Clean Java Language Server Workspace` 並依提示重載。
4. 在 **Run and Debug** 選擇 **Dynamic API：後端**，按 **F5** 偵錯，或 **Ctrl+F5** 執行；以 **Shift+F5** 停止。

`.vscode/launch.json` 使用 `type: java`、`mainClass: com.dynamicapi.Application`、`projectName: backend`，工作目錄為 `backend/`。此方式由 Java 擴充套件編譯並啟動，不會執行 Gradle 的 Next.js 建置任務，也不會套用 `bootJar -Penv` 的設定覆寫。

尚未建置內嵌前端時，請另依 [開發模式](#方式二開發模式前端熱更新) 啟動管理介面，從 `http://localhost:3000/endpoint` 使用。後端 API 為 `http://localhost:8080/dynamic-api/ws/getEndpoints`。若需要單一服務包含管理介面，改用完整的 `.\gradlew.bat bootRun`。

`base-jar` 與範例 JAR 指定 Java 17 toolchain；只安裝較新版本的 JDK，仍可能無法完成這些專案的匯入。

### 從 VS Code 啟動前端或前後端

第一次先從命令面板執行 `Tasks: Run Task` → **Dynamic API：安裝前端依賴**，等待安裝成功。這與在前端目錄執行 `npm install` 相同，依賴已安裝時不需每次重跑。

在 **Run and Debug** 選擇 **Dynamic API：前端** 後按 F5，會在前端目錄執行 `npm run dev -- --port 3000`，並由啟動設定傳入 `NEXT_PUBLIC_API_URL=http://localhost:8080`，不必另外建立 `.env.local`。看到 `Ready` 後開啟 `http://localhost:3000/endpoint`；若 port 3000 已占用，先停止占用該 port 的服務。

選擇 **Dynamic API：前後端** 後按 F5，會同時啟動兩個服務；此組合設定 `stopAll: true`，停止其中一個偵錯工作階段時會一起停止。若後端已在執行，只啟動前端即可，避免重複占用 port 8080。兩個服務同時啟動時，請等後端出現 `Started Application` 再操作管理介面。

## 方式三：啟動本文件網站

```bash
cd docs-site
npm install   # 第一次
npm start     # http://localhost:3000/dynamic-api/
```

Next.js 開發模式也使用 port 3000，兩者同時啟動時請改用 `npm start -- --port 3001`。

## Port 一覽

| 服務 | Port | 何時需要 |
|---|---|---|
| 後端（含生產模式前端） | 8080 | 一律需要 |
| Next.js 開發伺服器 | 3000 | 只在開發模式 |
| 文件網站 | 3000（建議改 3001） | 需要時 |

## 非 Windows 環境

`backend/build.gradle` 的前端建置任務寫死使用 `tools/node-v22.20.0-win-x64/npm.cmd`，而 `processResources` 依賴這個任務，所以在 macOS / Linux 上執行 `./gradlew bootRun` 或 `bootJar` 會在前端建置步驟失敗。目前可行的做法：

1. 手動在 `nextjs-dynamic-api-manager/` 執行 `NODE_ENV=production npm run build`，把 `out/` 內容複製到 `backend/src/main/resources/static/`。
2. 以 `./gradlew bootRun -x buildFrontend` 略過前端任務（Gradle 會一併略過它所依賴的 `installNextjs`、`buildNextjs` 等任務）。

同時記得把 `*.properties` 裡的 `D:/`、`C:/` 路徑改成該系統可用的路徑。

## 確認服務正常

```bash
curl http://localhost:8080/dynamic-api/ws/getEndpoints
```

回應 `{"code":200,"message":"OK","data":[]}` 代表後端與資料庫皆正常。接著到 [快速上手](./quick-start.md) 部署第一個服務。
