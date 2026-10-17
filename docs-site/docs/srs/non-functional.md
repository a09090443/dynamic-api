---
id: non-functional
title: 4. 非功能性需求
sidebar_label: 4. 非功能性需求
---

# 4. 非功能性需求

本系統定位為**開發／測試環境的工具**，不應部署為對外的正式服務。以下需求以此定位為前提。

## 4.1 效能與容量

| 編號 | 需求 | 現況說明 |
|---|---|---|
| NFR-PERF-01 | 單次 Mock 回應查詢應為單一主鍵查詢 | `MOCK_RESPONSE` 以四鍵為主鍵，查詢走主鍵索引 |
| NFR-PERF-02 | 啟用／停用單一服務應在數秒內完成 | 只涉及單一 JAR 的類別載入與註冊 |
| NFR-PERF-03 | 支援上傳 100MB 以內的 JAR | 由 multipart 設定控制 |
| NFR-PERF-04 | 支援數十個服務同時啟用 | 每個服務一個 ClassLoader；數量主要受 JVM Metaspace 限制 |
| NFR-PERF-05 | 適用低並發寫入情境 | SQLite 單一寫入者；多人同時大量編輯可能遇到鎖定 |

## 4.2 可用性與可靠度

| 編號 | 需求 | 現況說明 |
|---|---|---|
| NFR-AVL-01 | 重啟後自動恢復已啟用的服務 | `SetupWebservices`、`SetupController` 於啟動時執行 |
| NFR-AVL-02 | 單一服務載入失敗不得影響其他服務或系統啟動 | 失敗者改為停用並記錄日誌 |
| NFR-AVL-03 | 啟用失敗時不得留下半註冊狀態 | Endpoint 失敗時移除 ClassLoader；RESTful 若在註冊部分方法後失敗，已註冊的對應不會回收（技術債 TD-05） |
| NFR-AVL-04 | 資料與 JAR 應可備份 | 備份 SQLite 檔與 `jar.file.dir` 即可完整還原 |

## 4.3 安全性與隱私

| 編號 | 需求 | 現況說明 |
|---|---|---|
| NFR-SEC-01 | 僅部署於受信任的內部網路 | 系統**沒有任何認證或授權**，可執行上傳的任意 JAR，等同允許遠端執行程式碼 |
| NFR-SEC-02 | CORS 僅允許已知的前端來源 | 允許 `http://localhost:3000`、`http://localhost:4200` |
| NFR-SEC-03 | 日誌串流應限制於日誌目錄內 | 目前 `logFileName` 未過濾 `..`，可讀取任意檔案（技術債 TD-07） |
| NFR-SEC-04 | Mock 回應不應存放真實個資 | 回應內容以明文存放於 SQLite |
| NFR-SEC-05 | 資料庫密碼加密選項 | `dynamic.is-encrypt=false`；SQLite 無帳密 |

:::danger 部署提醒
任何能存取管理 API 的人都能上傳並執行任意 Java 程式碼。若需要在共用環境部署，至少應以反向代理加上認證或 IP 白名單。
:::

## 4.4 可維護性與可擴充性

| 編號 | 需求 | 現況說明 |
|---|---|---|
| NFR-MNT-01 | 資料庫結構以版本化遷移管理 | Flyway，腳本位於 `db.migration/` |
| NFR-MNT-02 | 自訂 JAR 只依賴穩定的基底 API | `RestfulBase`、`WebserviceBase`、`MockResponseDao` |
| NFR-MNT-03 | 設定與程式分離 | 路徑、資料來源、日誌皆在 `*.properties` |
| NFR-MNT-04 | 前後端可分開開發、合併部署 | 開發模式分開啟動；`bootJar` 整合為單一 JAR |
| NFR-MNT-05 | 自動化測試 | 後端僅有少量測試（`ResponseRepositoryTest`、`DynamicControllerServiceTest`），前端無測試 |

## 4.5 使用性

| 編號 | 需求 | 現況說明 |
|---|---|---|
| NFR-USE-01 | 介面語言為繁體中文 | 是 |
| NFR-USE-02 | 會改變服務狀態的操作需二次確認 | 切換開關、刪除皆有確認對話框 |
| NFR-USE-03 | 清單支援搜尋與分頁 | 前端實作 |
| NFR-USE-04 | 錯誤需以可理解的訊息呈現 | 部分錯誤只顯示「Internal Server Error」，需查日誌 |

## 4.6 法規與合規

本系統不處理正式資料，無特定法規要求。若 Mock 回應中使用真實資料，需遵循所屬組織的資料保護規範。
