# Dynamic API Manager 文件網站

以 [Docusaurus 3](https://docusaurus.io/) 建置的專案文件，內容依 `new-frontend` 分支程式碼整理。

## 常用指令

```bash
cd docs-site
npm install          # 第一次
npm start            # 開發伺服器 http://localhost:3000（與 Next.js 衝突時加 -- --port 3001）
npm run build        # 建置到 build/，同時產生搜尋索引、llms.txt、llms-full.txt
npm run serve        # 預覽建置結果（搜尋功能只在建置後可用）
npm run clear        # 清除快取
```

## 內容結構

```
docs/
├── intro.md              # 文件總覽
├── guide/                # 使用者指南：安裝、快速上手、操作、設定、疑難排解
├── jar-dev/              # JAR 開發指南：base-jar、RESTful / Endpoint JAR、Condition、打包
├── srs/                  # 需求規格書（章節 0–8）
│   └── functional/       # 3. 功能性需求
└── sdd/                  # 設計規格書（章節 0–10）
    └── api/              # 5. 管理 API 規格
```

側邊欄定義在 `sidebars.js`，四個區塊各有一個 sidebar，對應導覽列的四個項目。

## 撰寫規範

- 使用台灣繁體中文；程式碼識別字維持原文。
- 每個檔案以 frontmatter 指定 `id`、`title`、`sidebar_label`。
- 內部連結使用相對路徑的 `.md` 連結（例如 `[管理 Endpoint](../guide/endpoint.md)`），不要使用 `[[...]]`。建置時壞連結會直接失敗（`onBrokenLinks: 'throw'`）。
- 圖表使用 Mermaid（已啟用 `@docusaurus/theme-mermaid`）。
- 需求編號（`FR-*`、`NFR-*`、`BR-*`）、已知問題（`KI-*`）與技術債（`TD-*`）的編號請保持穩定，新增時接續編號。
- 描述系統行為時以程式碼為準；行為與預期不符時標註為「已知問題」，不要寫成預期行為。

## 搜尋與 AI 優化

| 功能 | 實作 |
|---|---|
| 站內搜尋（中英文） | `@easyops-cn/docusaurus-search-local` |
| `llms.txt`、`llms-full.txt` | `docusaurus-plugin-llms`，建置後位於 `build/` |
| AI 爬蟲設定 | `static/robots.txt` |

部署前請把 `docusaurus.config.js` 的 `url`、`baseUrl` 與 `static/robots.txt` 的網址改成實際位置。
