# Dynamic API Manager 文件網站

本目錄包含使用 Docusaurus 建立的線上文件網站。

## 快速開始

### 1. 安裝依賴

```bash
cd website
npm install
```

### 2. 啟動開發伺服器

```bash
npm start
```

瀏覽器會自動開啟 `http://localhost:3000`

### 3. 建置靜態網站

```bash
npm run build
```

建置產物位於 `build/` 目錄

### 4. 預覽建置產物

```bash
npm run serve
```

## 文件結構

```
website/
├── docs/                      # 文件內容
│   ├── srs/                   # 需求規格書 (SRS)
│   │   ├── intro.md
│   │   ├── introduction/      # 簡介章節
│   │   ├── overview/          # 系統概述
│   │   ├── functional-requirements/  # 功能需求
│   │   ├── non-functional/    # 非功能需求
│   │   ├── interfaces/        # 外部介面
│   │   ├── data-rules.md      # 資料與業務規則
│   │   └── acceptance.md      # 驗收與測試
│   │
│   └── sdd/                   # 設計規格書 (SDD)
│       ├── intro.md
│       ├── introduction/      # 簡介章節
│       ├── architecture/      # 系統架構
│       ├── modules/           # 模組設計
│       ├── database/          # 資料設計
│       ├── api/               # API 設計
│       ├── workflows/         # 業務流程
│       ├── security/          # 安全性設計
│       ├── deployment/        # 部署與運維
│       └── decisions/         # 設計決策
│
├── src/                       # React 組件
│   ├── pages/                 # 自訂頁面
│   │   └── index.js           # 首頁
│   └── css/                   # 自訂樣式
│
├── static/                    # 靜態資源
│   └── img/                   # 圖片
│
├── docusaurus.config.js       # Docusaurus 配置
├── sidebars.js                # 側邊欄配置
└── package.json               # 依賴管理
```

## 文件導覽

### 需求規格書 (SRS)
訪問：http://localhost:3000/docs/srs/intro

包含：
- 系統範圍與目標
- 功能需求（26 條需求）
- 非功能需求（21 條需求）
- 外部介面規格
- 驗收標準

### 設計規格書 (SDD)
訪問：http://localhost:3000/docs/sdd/intro

包含：
- 系統架構設計
- 模組與元件設計
- 資料庫設計（ERD、Schema）
- API 設計規格
- 部署與運維

## 自訂配置

### 修改網站標題
編輯 `docusaurus.config.js`：
```javascript
const config = {
  title: 'Dynamic API Manager',
  tagline: '動態 API 管理系統',
  // ...
};
```

### 調整側邊欄
編輯 `sidebars.js` 以調整文件結構與導覽。

### 修改主題顏色
編輯 `src/css/custom.css`：
```css
:root {
  --ifm-color-primary: #2e8555;
  /* 調整其他顏色變數 */
}
```

## 部署

### 部署至 GitHub Pages

1. 修改 `docusaurus.config.js`：
```javascript
url: 'https://your-username.github.io',
baseUrl: '/dynamic-api/',
organizationName: 'your-username',
projectName: 'dynamic-api',
```

2. 執行部署：
```bash
npm run deploy
```

### 部署至其他平台

建置後將 `build/` 目錄上傳至任何靜態網站託管服務（Netlify、Vercel、AWS S3 等）。

## 開發提示

### 熱更新
`npm start` 啟動的開發伺服器支援熱更新，修改 Markdown 檔案後會自動重新載入。

### 搜尋功能
Docusaurus 內建搜尋功能（需啟用 Algolia DocSearch 或使用本地搜尋插件）。

### 版本管理
可使用 Docusaurus 的版本功能管理多個文件版本：
```bash
npm run docusaurus docs:version 1.0.0
```

## 常見問題

### 1. 安裝依賴失敗
確保 Node.js 版本 >= 18.0：
```bash
node --version
```

### 2. 連結失敗
確認文件內部連結使用相對路徑，例如：
```markdown
[功能需求](../functional-requirements/jar-management)
```

### 3. 建置失敗
檢查是否有未關閉的 Markdown 語法（如：程式碼區塊、表格）。

## 參考資源

- [Docusaurus 官方文件](https://docusaurus.io/)
- [Markdown 語法指南](https://www.markdownguide.org/)
- [React 官方文件](https://react.dev/)

## 授權

本文件採用與 Dynamic API Manager 專案相同的授權。
