# 啟動 Docusaurus 文件網站

本文件說明如何快速啟動 Dynamic API Manager 的線上文件網站。

## 前置需求

確保已安裝：
- **Node.js**：版本 >= 18.0
- **npm**：隨 Node.js 安裝

檢查版本：
```bash
node --version
npm --version
```

---

## 快速啟動（3 步驟）

### 步驟 1：進入文件目錄

```bash
cd website
```

### 步驟 2：安裝依賴

**首次執行需要安裝依賴**（約需 1-2 分鐘）：

```bash
npm install
```

### 步驟 3：啟動開發伺服器

```bash
npm start
```

瀏覽器會自動開啟 `http://localhost:3000`，您將看到文件首頁。

---

## 文件導覽

啟動後，您可以瀏覽以下文件：

### 需求規格書 (SRS)
**路徑**：http://localhost:3000/docs/srs/intro

**包含內容**：
- 系統範圍與目標
- 功能需求（26 條）
- 非功能需求（21 條）
- 外部介面規格
- 驗收標準

**適合閱讀者**：PM、BA、開發人員、測試人員

---

### 設計規格書 (SDD)
**路徑**：http://localhost:3000/docs/sdd/intro

**包含內容**：
- 系統架構設計
- 模組與元件設計
- 資料庫設計（ERD、Schema）
- API 設計規格（含 Request/Response 範例）
- 業務流程圖
- 部署與運維指南

**適合閱讀者**：架構師、後端開發、前端開發、維運人員

---

## 文件特色

### 1. 即時搜尋
左上角搜尋框可快速查找關鍵字

### 2. 響應式側邊欄
自動產生導覽目錄，方便跳轉

### 3. 程式碼高亮
支援 Java、JSON、YAML、Bash 等語法高亮

### 4. 深色模式
右上角可切換深色/淺色主題

### 5. 自動導航
每個頁面底部有「上一頁」「下一頁」連結

---

## 其他命令

### 建置靜態網站
```bash
npm run build
```
產物位於 `build/` 目錄，可部署至任何靜態網站託管服務。

### 預覽建置產物
```bash
npm run serve
```
預覽建置後的網站（`http://localhost:3000`）

### 清除快取
```bash
npm run clear
```
若遇到問題，可清除 Docusaurus 快取

---

## 文件結構說明

```
website/docs/
├── srs/                          # 需求規格書
│   ├── intro.md                  # 文件資訊
│   ├── introduction/             # 簡介章節
│   │   ├── purpose.md
│   │   ├── scope.md
│   │   ├── audience.md
│   │   ├── glossary.md
│   │   └── references.md
│   ├── overview/                 # 系統概述
│   │   ├── goals.md              # 系統目標（已建立）
│   │   ├── stakeholders.md       # 利害關係人（待建立）
│   │   ├── use-cases.md          # 使用情境（待建立）
│   │   └── architecture.md       # 高階架構（待建立）
│   ├── functional-requirements/  # 功能需求（待建立）
│   ├── non-functional/           # 非功能需求（待建立）
│   ├── interfaces/               # 外部介面（待建立）
│   ├── data-rules.md             # 資料規則（待建立）
│   └── acceptance.md             # 驗收標準（待建立）
│
└── sdd/                          # 設計規格書
    ├── intro.md                  # 文件資訊（已建立）
    ├── introduction/             # 簡介章節（待建立）
    ├── architecture/             # 系統架構（待建立）
    ├── modules/                  # 模組設計（待建立）
    ├── database/                 # 資料設計（待建立）
    ├── api/                      # API 設計（待建立）
    ├── workflows/                # 業務流程（待建立）
    ├── security/                 # 安全性設計（待建立）
    ├── deployment/               # 部署與運維（待建立）
    └── decisions/                # 設計決策（待建立）
```

**註**：由於文件內容龐大，目前已建立基礎結構與部分章節，剩餘章節將陸續補充。

---

## 常見問題

### Q1：安裝依賴時出現錯誤
**A**：確認 Node.js 版本 >= 18.0：
```bash
node --version
```
若版本過舊，請至 https://nodejs.org/ 下載最新 LTS 版本。

---

### Q2：啟動後瀏覽器未自動開啟
**A**：手動開啟瀏覽器，訪問 `http://localhost:3000`

---

### Q3：修改文件後未立即更新
**A**：Docusaurus 支援熱更新，稍等 1-2 秒即可看到變更。若未更新，可嘗試刷新瀏覽器（Ctrl+R）。

---

### Q4：如何新增文件頁面
**A**：
1. 在 `docs/` 對應目錄下新增 `.md` 檔案
2. 檔案開頭加上 Front Matter：
   ```markdown
   ---
   sidebar_position: 1
   ---
   ```
3. 若需出現在側邊欄，請編輯 `sidebars.js`

---

### Q5：如何修改網站標題或樣式
**A**：
- **標題**：編輯 `docusaurus.config.js` 的 `title` 與 `tagline`
- **樣式**：編輯 `src/css/custom.css`

---

## 下一步

### 完善文件內容
目前已建立基礎結構，剩餘章節將陸續補充：
- SRS 功能需求詳細內容
- SDD 模組設計詳細內容
- API 範例與流程圖

### 部署至 GitHub Pages
完成後可部署至 GitHub Pages，供團隊成員線上存取：
1. 編輯 `docusaurus.config.js` 設定 GitHub 資訊
2. 執行 `npm run deploy`

### 整合專案文件
可將此文件網站整合至 CI/CD 流程，自動建置與部署。

---

## 需要協助？

若有任何問題，請參考：
- [Docusaurus 官方文件](https://docusaurus.io/)
- [website/README.md](website/README.md)（詳細說明）

---

**立即開始**：
```bash
cd website
npm install
npm start
```

享受您的文件閱讀之旅！
