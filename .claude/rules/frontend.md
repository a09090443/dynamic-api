---
paths:
  - "nextjs-dynamic-api-manager/**"
  - "backend/build.gradle"
  - "backend/src/main/java/com/dynamicapi/config/SpaController.java"
  - "backend/src/main/java/com/dynamicapi/config/WebConfig.java"
---

# Next.js 管理介面與建置整合

設計說明：`docs-site/docs/sdd/frontend.md`。

## 常用命令

```powershell
cd nextjs-dynamic-api-manager
npm install
npm run dev          # http://localhost:3000/endpoint（需另外啟動後端，並設定 .env.local，見下方「API 呼叫」）
npm run type-check
npm run lint
```

非 Windows 環境要手動建置生產版本：`NODE_ENV=production npm run build`，再把 `out/` 複製到 `backend/src/main/resources/static/`，並把各頁 `<page>/index.html` 複製為 `<page>.html`。

## 目錄樹

`(未使用)` 為目前沒有被引用的程式。

```
nextjs-dynamic-api-manager/
├── package.json                 # scripts：dev / build（皆用 --turbopack）、type-check、lint
├── next.config.ts               # 生產模式：output export、basePath /dynamic-api、trailingSlash
├── next.config.js               # 與 .ts 內容相近的舊設定（TD-10），修改時兩份一起改
├── tsconfig.json                # 路徑別名 @/* → src/*
├── eslint.config.mjs、postcss.config.mjs
├── .env.development、.env.production   # 進版控
├── .env.local.example           # 本機覆寫範本；實際的 .env.local 不進版控
├── ENVIRONMENT.md、PROJECT_SUMMARY.md、README.md
├── public/                      # create-next-app 預設圖示
└── src/
    ├── app/                     # App Router；每頁都是 'use client'
    │   ├── layout.tsx           # 根版面（'use client'）：直接套用 ThemeProvider(techTheme)、Header、Container
    │   ├── page.tsx             # 首頁
    │   ├── endpoint/page.tsx    # Endpoint 清單、開關、WSDL 工具入口
    │   ├── restful/page.tsx     # RESTful 清單、開關
    │   ├── response/page.tsx    # Mock 回應（讀 ?publishUri=&serviceType=，以 Suspense 包住）
    │   ├── about/page.tsx
    │   ├── test-api/page.tsx    # 舊測試頁，呼叫已不存在的 /api 代理
    │   ├── not-found.tsx
    │   └── globals.css
    ├── components/
    │   ├── Header.tsx           # 導覽列（新增頁面時加連結）
    │   ├── Providers.tsx        # (未使用) 主題改由 layout.tsx 直接設定
    │   ├── CyberpunkBackground.tsx   # (未使用)
    │   └── CyberpunkLoader.tsx       # (未使用)
    ├── forms/                   # react-hook-form + yup
    │   ├── EndpointForm.tsx
    │   └── RestfulForm.tsx
    ├── dialogs/WsdlGenObjDialog.tsx   # WSDL 轉換（送出 wsdlPath，與後端 wsdlUrl 不符：KI-03）
    ├── services/                # 所有 API 呼叫 [management-api.md]
    │   ├── api.ts               # axios 實例 apiClient、code ≠ 200 視為錯誤
    │   ├── endpoint.service.ts  # /dynamic-api/ws、uploadJarFile
    │   ├── restful.service.ts   # /dynamic-api/api
    │   └── response.service.ts  # /dynamic-api/common
    ├── types/                   # 與後端 DTO 對應 [management-api.md]
    │   ├── models.ts
    │   └── response.ts
    ├── config/config.ts         # appConfig：apiUrl 判斷、debugMode、timeout
    └── theme/
        ├── tech.ts              # 目前使用的 MUI 主題
        └── cyberpunk.ts         # (未使用)
```

新元件依類型放入 `components/`、`forms/`、`dialogs/`；API 呼叫只放在 `services/`；型別放在 `types/`。

## 生產模式是靜態匯出

`NODE_ENV=production` 時 `next.config` 啟用 `output: 'export'`、`basePath: '/dynamic-api'`、`trailingSlash: true`，產物由 Spring Boot 提供。因此：

- **不可使用**：API Routes（`src/app/api/**`）、Server Actions、SSR／`getServerSideProps`、需要伺服器的 middleware、`next/image` 最佳化。
- 頁面一律是 Client Component（`'use client'`），資料在瀏覽器端用 `src/services/*` 取得。
- 使用 `useSearchParams` 的元件要包在 `<Suspense>` 中（參考 `src/app/response/page.tsx`），否則靜態匯出會失敗。
- `basePath` 必須等於後端 `server.servlet.context-path`（`/dynamic-api`），兩者同步修改。

## 新增頁面要改三個地方

1. `nextjs-dynamic-api-manager/src/app/<page>/page.tsx`
2. `backend/build.gradle` 中 `copyNextjsBuild` 的 `pages` 清單（把 `<page>/index.html` 複製為 `<page>.html`）
3. `backend/.../config/SpaController.java` 的 `@GetMapping` 路徑清單（含有、無結尾斜線兩種）

漏掉 2 或 3，生產模式該頁會 404，但開發模式看不出來。導覽列在 `src/components/Header.tsx`。

## API 呼叫

- 一律透過 `src/services/api.ts` 的 `apiClient`，不要在元件中直接用 `fetch`／新的 axios 實例（`test-api` 頁是舊的反例）。
- `appConfig.apiUrl`（`src/config/config.ts`）在頁面不是從 `:3000` 開啟時會變成空字串（同源相對路徑）。不要改成固定網址。
- 開發模式的 API 代理路由已刪除（KI-01）；本機開發需在 `.env.local` 設 `NEXT_PUBLIC_API_URL=http://localhost:8080`。若要恢復代理，用 `next.config` 的 `rewrites`（只在開發模式生效），不要新增 API Route。

## 設定檔

- `next.config.ts` 與 `next.config.js` 並存（TD-10）。修改設定時兩份都要改，或先確認並刪除其中一份。
- 以 `NEXT_PUBLIC_` 開頭的變數會被打包進前端程式碼，不可放機密。

## 慣例

- UI 使用 MUI 7（`@mui/material`、`@mui/x-data-grid`）；表單使用 `react-hook-form` + `yup`（參考 `src/forms/`）。
- 介面文字使用台灣繁體中文。
- 會改變服務狀態的操作（開關、刪除）要有確認對話框。

## 建置注意

- Gradle 的 `installNextjs`、`buildNextjs` 寫死 `tools/node-v22.20.0-win-x64/npm.cmd`（TD-11），只能在 Windows 執行。
- `processResources` 依賴前端建置，因此每次 `bootRun`／`bootJar` 都會重建前端。只改後端時可用 `-x buildFrontend` 略過。

## 驗證

`npm run type-check`、`npm run lint`；涉及路由或建置設定時，執行 `cd backend && .\gradlew.bat bootRun`，從 `http://localhost:8080/dynamic-api/` 驗證生產模式。
