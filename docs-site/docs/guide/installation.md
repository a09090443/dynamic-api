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

`bootRun` / `bootJar` 會先自動執行前端建置：`npm install` → `next build`（靜態匯出）→ 複製到 `backend/src/main/resources/static/`。第一次建置需要數分鐘。

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

## 方式二：開發模式（前端熱更新）

適合修改管理介面時使用，需同時啟動後端與前端。

```powershell
# 終端機 1：後端
cd backend
.\gradlew.bat bootRun

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
