---
paths:
  - "nextjs-dynamic-api-manager/**"
  - "backend/build.gradle"
  - "backend/src/main/java/com/dynamicapi/config/SpaController.java"
  - "backend/src/main/java/com/dynamicapi/config/WebConfig.java"
---

# Next.js 管理介面與建置整合

設計說明：`docs-site/docs/sdd/frontend.md`。視覺與畫面規格：`design/admin-light-redesign/`（README、`tokens.json`、`screens/*.dc.html`，唯讀參考；畫面檔中的示意資料不可寫死）。

## 常用命令

```powershell
cd nextjs-dynamic-api-manager
npm install
npm run dev          # http://localhost:3000/endpoint（需另外啟動後端，並設定 .env.local，見下方「API 呼叫」）
npm run type-check
npm run lint
npm run test:e2e     # Playwright；先安裝 chromium，測試會自行在 127.0.0.1:3100 建置並啟動前端
```

非 Windows 環境要手動建置生產版本：`NODE_ENV=production npm run build`，再把 `out/` 內容複製到 `backend/src/main/resources/static/`。不需要再把各頁的 `<page>/index.html` 改名為 `<page>.html`：後端 `SpaController` 找不到 `<page>.html` 時會改讀 `<page>/index.html`（例如 `/dynamic-api/wsdl`、`/dynamic-api/wsdl/` 都能開啟）。

## 目錄樹

`(未使用)` 為目前沒有被引用的程式。

```
nextjs-dynamic-api-manager/
├── package.json                 # scripts：dev / build（皆用 --turbopack）、type-check、lint、test:e2e
├── playwright.config.ts         # chromium E2E；webServer 使用 127.0.0.1:3100（同源）
├── e2e/                         # Playwright 規格；fixtures/mock-api.ts（攔截管理 API）、fixtures/mock-data.ts（假資料）
├── next.config.ts               # 生產模式：output export、basePath /dynamic-api、trailingSlash；DYNAMIC_API_E2E=1 時停用 export
├── next.config.js               # 與 .ts 內容相近的舊設定（TD-10），修改時兩份一起改
├── tsconfig.json                # 路徑別名 @/* → src/*
├── eslint.config.mjs、postcss.config.mjs
├── .env.development、.env.production   # 進版控
├── .env.local.example           # 本機覆寫範本；實際的 .env.local 不進版控
├── ENVIRONMENT.md、PROJECT_SUMMARY.md、README.md
├── public/                      # create-next-app 預設圖示
└── src/
    ├── app/                     # App Router；每頁都是 'use client'
    │   ├── layout.tsx           # 根版面：透過 Providers 套用明亮版主題，並包上全站外框（左側側欄＋頂列麵包屑）
    │   ├── page.tsx             # 首頁
    │   ├── endpoint/page.tsx    # Endpoint 清單：統計卡、搜尋與狀態篩選、批次操作、分頁、Mock 回應筆數、確認框與 toast
    │   ├── restful/page.tsx     # RESTful 清單（元件樣式比照 Endpoint 清單）、開關
    │   ├── response/page.tsx    # Mock 回應（讀 ?publishUri=&serviceType=，以 Suspense 包住）；右側編輯面板新增／編輯
    │   ├── wsdl/page.tsx        # WSDL 轉換獨立頁（取代原 WsdlGenObjDialog 彈窗）
    │   ├── about/page.tsx       # 系統資訊
    │   ├── test-api/page.tsx    # 舊測試頁，呼叫已不存在的 /api 代理；保留網址，不放進側欄
    │   ├── not-found.tsx
    │   └── globals.css
    ├── components/              # Providers（主題）、ServiceSummaryProvider（側欄筆數與連線狀態）、StatusSwitch、StatusBadge
    │   ├── shell/               # 全站外框（側欄、頂列麵包屑）
    │   ├── feedback/            # 共用確認框（ConfirmProvider）與 toast（含啟停復原）
    │   ├── service-list/        # Endpoint／RESTful 清單共用的表格、開關、啟停與刪除操作
    │   ├── response/            # Mock 回應頁的資訊卡與右側編輯面板
    │   └── Cyberpunk*.tsx       # (未使用) 舊深色風格元件，若仍存在也不要再引用
    ├── forms/                   # react-hook-form + yup
    │   ├── EndpointForm.tsx
    │   └── RestfulForm.tsx
    ├── dialogs/                 # 對話框類元件；WSDL 轉換已改為 /wsdl 頁，不再使用彈窗
    ├── services/                # 所有 API 呼叫 [management-api.md]
    │   ├── api.ts               # axios 實例 apiClient、code ≠ 200 視為錯誤
    │   ├── endpoint.service.ts  # /dynamic-api/ws、uploadJarFile、genWsdlObj（multipart：wsdlUrl／file／packageName）
    │   ├── restful.service.ts   # /dynamic-api/api
    │   └── response.service.ts  # /dynamic-api/common
    ├── types/                   # 與後端 DTO 對應 [management-api.md]
    │   ├── models.ts
    │   └── response.ts
    ├── utils/                   # serviceUrl.ts（畫面顯示的主機與服務呼叫位址）、formatContent.ts（JSON／XML 格式化）
    ├── config/config.ts         # appConfig：apiUrl 判斷、debugMode、timeout
    └── theme/                   # 明亮版 MUI 主題（palette.mode 'light'，色碼取自 tokens.json）；舊深色主題 tech.ts、cyberpunk.ts 不再使用
```

新元件依類型放入 `components/`、`forms/`、`dialogs/`；API 呼叫只放在 `services/`；型別放在 `types/`。新增前先確認外框、確認框、toast、開關等共用元件是否可沿用。

## 生產模式是靜態匯出

`NODE_ENV=production` 時 `next.config` 啟用 `output: 'export'`、`basePath: '/dynamic-api'`、`trailingSlash: true`，產物由 Spring Boot 提供。因此：

- **不可使用**：API Routes（`src/app/api/**`）、Server Actions、SSR／`getServerSideProps`、需要伺服器的 middleware、`next/image` 最佳化。
- 頁面一律是 Client Component（`'use client'`），資料在瀏覽器端用 `src/services/*` 取得。
- 使用 `useSearchParams` 的元件要包在 `<Suspense>` 中（參考 `src/app/response/page.tsx`），否則靜態匯出會失敗。
- `basePath` 必須等於後端 `server.servlet.context-path`（`/dynamic-api`），兩者同步修改。

Playwright 的 webServer 會設定 `DYNAMIC_API_E2E=1`，只在 E2E 建置時停用 `output: 'export'`，讓測試能以 `next start` 在 `127.0.0.1:3100` 啟動；`basePath` 與 `trailingSlash` 仍維持生產設定。未設定此變數時，正式建置與出貨產物不變。E2E 測試跑的是非靜態匯出版本，與實際出貨形式略有差異。

## 新增頁面要改三個地方

1. `nextjs-dynamic-api-manager/src/app/<page>/page.tsx`
2. `backend/build.gradle` 中 `copyNextjsBuild` 的 `pages` 清單：Windows 建置時用這份清單把 `<page>/index.html` 複製為 `<page>.html`。新增頁面時仍要加入頁名，但漏加不會再造成 404（`SpaController` 會改讀 `<page>/index.html`）。
3. `backend/.../config/SpaController.java` 的 `@GetMapping` 路徑清單（含有、無結尾斜線兩種）

漏掉 3（`SpaController` 路徑），生產模式該頁會 404，但開發模式看不出來；漏掉 2（`pages` 清單）時，`SpaController` 仍會改讀 `<page>/index.html`。需要出現在導覽時，在 `components/shell/` 的側欄元件加入連結，並補上頂列麵包屑；側欄的目前頁要帶 `aria-current="page"`。只改 `pages` 清單加頁名，不要為了在其他環境建置而改寫 `buildFrontend` 等前端建置任務。

## API 呼叫

- 一律透過 `src/services/api.ts` 的 `apiClient`，不要在元件中直接用 `fetch`／新的 axios 實例（`test-api` 頁是舊的反例）。
- `appConfig.apiUrl`（`src/config/config.ts`）在頁面不是從 `:3000` 開啟時會變成空字串（同源相對路徑）。不要改成固定網址。
- `appConfig.apiUrl` 只決定 API 請求送往哪裡，**不得**拿來組畫面上的位址。頂列顯示的主機一律取 `window.location.host`，Mock 回應頁的 SOAP（`<origin>/dynamic-api/webservice/<publishUri>`）與 REST（`<origin>/dynamic-api/<publishUri>`）呼叫位址及複製內容一律取 `window.location.origin`；即使 `NEXT_PUBLIC_API_URL` 指向不同來源的絕對網址（例如開發模式的 `http://localhost:8080`）也一樣，不寫死 `localhost:8080`。這類組法集中在 `src/utils/serviceUrl.ts`。連線狀態仍依實際管理 API 呼叫成敗判斷，與顯示的主機來源無關。
- 開發模式的 API 代理路由已刪除（KI-01）；本機開發需在 `.env.local` 設 `NEXT_PUBLIC_API_URL=http://localhost:8080`。若要恢復代理，用 `next.config` 的 `rewrites`（只在開發模式生效），不要新增 API Route。
- 介面需要的資料後端沒有提供時（例如各服務的 Mock 回應筆數、批次啟停），用既有 API 組合（逐服務查詢、逐筆呼叫並彙總成功與失敗），不要自行修改後端契約，也不要用假資料或寫死示意數字掩蓋。

## 進行中的請求與表單狀態

送出後到回應前，使用者仍可能關閉面板、開啟另一筆或修改輸入。會改變資料或觸發下載的請求（Mock 回應儲存、WSDL 轉換等）必須保證回應只作用在**原本送出的那一次**：

- 擇一做法：請求進行中鎖定輸入、來源切換與關閉／切換面板（Esc、關閉鈕、點其他列）；或為每次送出標記識別（遞增序號、`AbortController`），回應回來時比對，已過期的回應不得關閉後來開的表單、不得改寫目前輸入、不得顯示結果或觸發下載。
- 失敗時，原本送出的輸入要仍可在畫面上看到並可直接重試，同時顯示錯誤回饋；不要讓卸載的元件吞掉錯誤或遺失輸入。
- WSDL 轉換的結果卡與下載必須對應同一次送出的來源（網址或檔案）與 Package 名稱；網址模式與檔案模式在 204、非 2xx、網路錯誤時都要保留已輸入的網址／所選檔案／Package 名稱。

## 設定檔

- `next.config.ts` 與 `next.config.js` 並存（TD-10）。修改設定時兩份都要改，或先確認並刪除其中一份。
- 以 `NEXT_PUBLIC_` 開頭的變數會被打包進前端程式碼，不可放機密。

## 慣例

- UI 使用 MUI 7（`@mui/material`、`@mui/x-data-grid`）；表單使用 `react-hook-form` + `yup`（參考 `src/forms/`）。
- 主題為明亮版（頁面底色 `#f5f7fa`、主色 `#2563eb`、按鈕文字不轉大寫），色碼與尺寸以 `design/admin-light-redesign/tokens.json` 為準。
- 不載入 Google Fonts 等外部字型網址（系統部署在內部網路）；`font-family` 以 `system-ui`／`monospace` 作為後援。
- 介面文字使用台灣繁體中文。
- 會改變服務狀態的操作（開關、刪除）要有自訂確認對話框，不使用瀏覽器 `window.alert`／`window.confirm`。成功後以 toast 回饋；啟停可提供「復原」（反向呼叫一次），刪除不提供復原。確認框文案要符合後端實際行為（例如刪除 Endpoint 不會刪除 Mock 回應）。
- 資料畫面要呈現載入中、無資料、搜尋無結果與載入失敗（含重試）狀態；窄螢幕時側欄換到內容上方，不可出現整頁橫向捲動，寬表格只在自己的容器內捲動。

## 建置注意

- Gradle 的 `installNextjs`、`buildNextjs` 寫死 `tools/node-v22.20.0-win-x64/npm.cmd`（TD-11），只能在 Windows 執行。
- `processResources` 依賴前端建置，因此每次 `bootRun`／`bootJar` 都會重建前端。只改後端時可用 `-x buildFrontend` 略過。

## 驗證

- 前端品質檢查依序執行：安裝依賴 → `npm run type-check` → `npm run lint` → 正式建置；任一步之後若再修改程式，從修改後的那一步重跑到正式建置，最終提交要有依此順序、對同一提交的完整紀錄，不要拿較早或分開執行的建置結果充當。
- 瀏覽器 E2E 使用 `npm run test:e2e`（API 以 `e2e/fixtures/mock-api.ts` 攔截，新增互動時在此補情境）。E2E 會把 `.next` 建成非匯出版本，不影響正式建置產生的 `out/`。
- E2E 在 `127.0.0.1:3100` 同源執行，API 來源與瀏覽器來源相同，無法區分兩者；修改主機或呼叫位址組法時，要補能區分「API 為不同來源絕對網址」與「瀏覽器網址」的斷言，做不到時在報告註明未驗證。
- 進行中請求的保護要以延遲回應驗證：送出後在回應前關閉／切換表單或修改輸入，再讓舊請求成功與失敗，斷言不影響後來的表單、輸入與下載；失敗類測試要涵蓋每種輸入模式（例如 WSDL 的網址與檔案）。
- 涉及路由或建置設定時，執行 `cd backend && .\gradlew.bat bootRun`，從 `http://localhost:8080/dynamic-api/` 驗證生產模式。型別檢查、lint 與建置通過不代表畫面正確；未實際開啟畫面驗證的項目要在報告中註明。
