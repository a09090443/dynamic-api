---
paths:
  - "docs-site/**"
---

# 文件網站（Docusaurus）

## 常用命令

```bash
cd docs-site
npm install
npm start                 # http://localhost:3000
npm start -- --port 3001  # 與 Next.js 開發模式同時啟動時避開 3000
npm run build             # 驗證連結，產生搜尋索引與 llms.txt
npm run serve             # 預覽建置結果（站內搜尋只在這裡可用）
npm run clear             # 清除快取
```

## 內容原則

- **以程式碼為準**。描述系統行為前先讀對應程式碼；行為與預期不符時寫成「已知問題」，不要寫成預期行為。
- 回答功能問題時發現文件與程式不一致，**必須在同一次工作中修正文件**（流程見 `AGENTS.md`「回答功能問題的流程」）。
- 使用台灣繁體中文；程式碼識別字、指令、設定鍵維持原文。
- 四個區塊各有讀者：`guide/`（操作者）、`jar-dev/`（JAR 開發者）、`srs/`（需求）、`sdd/`（設計與 API）。同一件事在不同區塊用不同深度描述，彼此以連結引用，不要整段複製。

## 編號必須穩定

| 編號 | 位置 |
|---|---|
| `FR-*`、`NFR-*`、`BR-*`、`UC-*` | `docs/srs/` |
| `KI-*`（已知問題） | `docs/srs/acceptance.md` 7.3；`docs/guide/troubleshooting.md` 的清單使用自己的流水號 |
| `TD-*`（技術債） | `docs/sdd/decisions.md` 9.3 |

不可重新編號或重複使用；新增時接續最大號。問題修正後，從清單移除並在 SRS／SDD 變更紀錄註記，同時檢查其他頁面中引用該編號的地方。

## 格式

- 每個檔案的 frontmatter 要有 `id`、`title`、`sidebar_label`。
- 內部連結使用相對路徑並帶 `.md`（`[管理 Endpoint](../guide/endpoint.md)`），不要使用 `[[...]]` 或 `/docs/...` 絕對路徑。`onBrokenLinks` 與 `onBrokenMarkdownLinks` 皆為 `throw`。
- 表格儲存格中的 `|`（包括 inline code 內）要寫成 `\|`。
- 圖表使用 Mermaid，注意：
  - 訊息或標籤中不可出現 `;`（會被當成敘述分隔，例如 `&lt;` 會出錯）。
  - 節點標籤含 `{`、`}`、`(`、`)` 等符號時，用雙引號包住：`A["/{publishUri}/*"]`。
  - 建置不會檢查 Mermaid 語法，錯誤只會在瀏覽器顯示。

## 新增或刪除頁面

1. `sidebars.js` 加入對應 sidebar。
2. `docusaurus.config.js` 中 `docusaurus-plugin-llms` 的 `includeOrder` 加入 `docs/<路徑>.md`（規則需含斜線，否則會以檔名比對到其他同名檔案）。
3. 若是重要入口，更新 `docs/intro.md` 的導覽表。

## 驗證

```bash
cd docs-site
npm run build   # 必須成功，且沒有 broken links／anchors 警告
```

建置會一併產生搜尋索引與 `llms.txt`、`llms-full.txt`；搜尋要用 `npm run serve` 才能測試。
