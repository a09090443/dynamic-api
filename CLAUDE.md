# CLAUDE.md

本專案的共用說明在 AGENTS.md（Codex 等工具也使用同一份）：

@AGENTS.md

## Claude Code 專用

- `.claude/rules/*.md` 會依檔頭的 `paths` 在編輯對應檔案時自動載入，不需要手動讀取。
- 新增說明時，全域性內容寫進 `AGENTS.md`，特定路徑的約定寫進 `.claude/rules/`（並更新 AGENTS.md 的規範對照表），不要寫回本檔。
