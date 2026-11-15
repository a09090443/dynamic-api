---
id: frontend
title: 3.4 管理介面（Next.js）
description: 'Next.js 管理介面的目錄結構、API 呼叫設計、頁面流程，以及靜態匯出並打包進後端的方式。'
sidebar_label: 3.4 管理介面
---

# 3.4 管理介面（Next.js）

## 結構

`nextjs-dynamic-api-manager/src/`：

| 目錄 | 內容 |
|---|---|
| `app/` | App Router 頁面：`page.tsx`（首頁）、`endpoint/`、`restful/`、`response/`、`about/`、`test-api/`、`layout.tsx`、`not-found.tsx` |
| `components/` | `Header`（導覽列）；`Providers`、`CyberpunkBackground`、`CyberpunkLoader` 目前未使用（MUI 主題由 `app/layout.tsx` 直接以 `techTheme` 設定） |
| `forms/` | `EndpointForm`、`RestfulForm`（react-hook-form + yup） |
| `dialogs/` | `WsdlGenObjDialog` |
| `services/` | `api.ts`（axios 實例）、`endpoint.service.ts`、`restful.service.ts`、`response.service.ts` |
| `types/` | `models.ts`、`response.ts` |
| `config/` | `config.ts`（環境設定） |
| `theme/` | `cyberpunk.ts`、`tech.ts` |

所有頁面皆為 Client Component（`'use client'`），資料在瀏覽器端以 axios 取得。

## API 呼叫設計

```mermaid
flowchart LR
    Page[頁面元件] --> Svc[xxx.service.ts<br/>BASE_PATH = /dynamic-api/ws 等]
    Svc --> AX[apiClient<br/>baseURL = appConfig.apiUrl]
    AX -->|baseURL + /dynamic-api/...| BE[後端]
```

`appConfig.apiUrl` 的決定邏輯（`config/config.ts`）：

| 情況 | `apiUrl` | 實際請求 |
|---|---|---|
| 瀏覽器網址**不含** `:3000`（生產模式） | `''` | `/dynamic-api/ws/...`（同源相對路徑） |
| 瀏覽器網址含 `:3000`（開發模式） | `NEXT_PUBLIC_API_URL` | `${NEXT_PUBLIC_API_URL}/dynamic-api/ws/...` |

`apiClient` 的回應攔截器：若 `response.data.code` 是數字且不等於 200，丟出 `Error(message)`；HTTP 錯誤時取 `error.response.data.message` 或 `statusText`。

:::warning 開發模式代理（KI-01）
`.env.development` 的 `NEXT_PUBLIC_API_URL=http://localhost:3000/api` 原本搭配 `src/app/api/dynamic-api/[...path]/route.ts` 將請求轉送到 `BACKEND_API_URL`。該路由已刪除，需改用 `NEXT_PUBLIC_API_URL=http://localhost:8080` 直連後端（CORS 已允許）。
:::

## 頁面流程

| 頁面 | 載入 | 操作 |
|---|---|---|
| Endpoint | `getEndpoints` | 新增／編輯：若有選檔先 `uploadJarFile` 取得 `jarFileId`，再 `saveWebService` / `updateWebService`；開關：`switchWebService`；刪除：`removeWebService`；回應清單：`router.push('/response?publishUri=&serviceType=ENDPOINT')` |
| RESTful | `getControllers` | 同上，對應 `/api/*` |
| Response | 讀取 query string 後 `getResponseList` | `saveMockResponse`、`updateResponse`、`switchResponse`、`deleteResponse` |
| WSDL 對話框 | — | `genWsdlObj`（`responseType: 'blob'`），以 `file-saver` 下載 |

搜尋與分頁皆在前端對已載入的清單處理。

## 建置與整合

| 模式 | 設定（`next.config.ts`） | 輸出 |
|---|---|---|
| 開發（`npm run dev`） | 無 `basePath`、無 `trailingSlash` | Next.js 開發伺服器 :3000 |
| 生產（`NODE_ENV=production npm run build`） | `output: 'export'`、`basePath: '/dynamic-api'`、`trailingSlash: true`、`images.unoptimized` | 靜態檔案於 `out/` |
| E2E（`DYNAMIC_API_E2E=1`，由 Playwright 自動帶入） | 同生產，但**不做** `output: 'export'`；`basePath`、`trailingSlash` 不變 | `.next/`，以 `next start` 在 `127.0.0.1:3100` 提供 |

生產建置由 Gradle 觸發，輸出複製到 `backend/src/main/resources/static/`，並把 `endpoint/index.html` 等複製為 `endpoint.html` 供 `SpaController` 讀取（見 [8. 部署](./deployment.md)）。

:::note 兩份 next.config
專案同時存在 `next.config.ts` 與 `next.config.js`，內容相近。Next.js 會優先使用其中一份（依版本規則），維護時請兩份同步或刪除其中一份（TD-10）。`DYNAMIC_API_E2E` 開關兩份都有實作。
:::

## E2E 測試（Playwright）

| 項目 | 內容 |
|---|---|
| 執行 | `cd nextjs-dynamic-api-manager && npm exec playwright install chromium`（第一次；Linux 可能需加 `--with-deps`），之後 `npm run test:e2e` |
| 設定 | `playwright.config.ts`：只有 chromium；`webServer` 以 `DYNAMIC_API_E2E=1` 執行 `npm run build && npm run start -- --hostname 127.0.0.1 --port 3100`，`reuseExistingServer: false`；`baseURL` 為 `http://127.0.0.1:3100/dynamic-api/` |
| 目錄 | `e2e/pages.spec.ts`（首頁、Endpoint、RESTful、Mock 回應的開啟與列表）、`e2e/restful-form.spec.ts`（RESTful 新增表單成功與驗證失敗）、`e2e/fixtures/`（假資料與攔截夾具） |
| 隔離 | `e2e/fixtures/mock-api.ts` 是自動套用的夾具，在任何 `page.goto` 前以 `page.route` 註冊：`/dynamic-api/ws`、`/dynamic-api/api`、`/dynamic-api/common` 一律回傳固定的 `{code, message, data}`，未定義的 API 回 `code=500` 且不轉送；非 `127.0.0.1:3100` 的請求（例如 Google Fonts）一律中止。測試不會連到真的後端或外部網站 |
| 輸出 | `test-results/`（trace 等）、`playwright-report/`（HTML 報告），兩者都不進版控、不受 ESLint 檢查 |

固定埠不用 3000：`config/config.ts` 在網址含 `:3000` 時改用 `NEXT_PUBLIC_API_URL`，API 就不會走同源路徑而無法攔截。

:::warning 與出貨形式的差異
正式出貨是靜態匯出（`out/`）由 Spring Boot 提供；E2E 為了能用 `next start` 啟動，跑的是非靜態匯出版本（`.next/`），路由與 `basePath` 相同，但伺服器行為略有差異。E2E 建置不會產生或改動 `out/`。
:::

:::note 表單驗證的實際行為
`RestfulForm`、`EndpointForm` 的必填欄位帶原生 `required` 且 `form` 沒有 `noValidate`，空白送出時由瀏覽器原生提示先擋下，yup 的錯誤文字（例如「發布名稱為必填」）不會出現。E2E 驗證失敗案例先斷言原生擋下，再以程式派送 `submit` 事件檢查 yup 規則。
:::
