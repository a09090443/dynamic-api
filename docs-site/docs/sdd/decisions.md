---
id: decisions
title: 9–10. 設計決策與技術債
description: '重大設計決策與否決的方案、TD-* 技術債清單、版本歷史與程式碼對照。'
sidebar_label: 9–10. 決策與技術債
---

# 9–10. 設計決策與技術債

## 9. 設計決策與權衡

### 9.1 重大設計決策

| # | 決策 | 理由 | 代價 |
|---|---|---|---|
| D-01 | 在同一個 JVM 中動態載入使用者 JAR | 不需額外行程或容器；使用者類別可直接使用 Spring、CXF 與注入 | 沒有隔離，使用者程式可影響整個系統 |
| D-02 | 每個服務一個 ClassLoader，父優先 | 不同服務的同名類別不衝突；確保基底類別型別一致 | 使用者無法使用與系統不同版本的函式庫 |
| D-03 | 比對邏輯放在 JAR，系統只提供四鍵查詢 | 系統保持協定無關、實作簡單；JAR 作者可完全控制比對 | 回應維護者需知道 JAR 的 condition 格式；容易填錯 |
| D-04 | 以 SQLite 作為預設資料庫，PostgreSQL 為可選項（以 `app.database.*` 切換方言與 Flyway 位置，兩套遷移腳本） | SQLite 零安裝、單檔備份，符合工具型系統定位；需要外部資料庫的使用者可改用 PostgreSQL | 兩種資料庫的遷移腳本都要維護；PostgreSQL 尚未在實際環境驗證；JVM 執行狀態仍在單一行程，改用 PostgreSQL 也不代表能多節點部署 |
| D-05 | JAR 存檔案系統、DB 只存中繼資料 | 避免大型 BLOB；`URLClassLoader` 需要檔案 URL | DB 與檔案需一起備份，可能不一致 |
| D-06 | 新建／編輯後一律停用，需明確啟用 | 避免半成品設定直接對外 | 使用者容易忘記啟用 |
| D-07 | 前端靜態匯出並打包進後端 JAR | 部署只有一個產物、同源無 CORS 問題 | 生產模式無法使用 Next.js 伺服器端功能 |
| D-08 | 啟動時以 DB 為準重建服務 | 重啟即恢復，不需額外操作 | 啟動時間隨服務數成長；失敗會被自動停用 |

### 9.2 考慮過但否決的方案

| 方案 | 否決原因 |
|---|---|
| JAR 以 BLOB 存入資料庫（前版文件描述） | `URLClassLoader` 需要檔案 URL，仍須落地；SQLite 存大型 BLOB 效能差 |
| 系統內建規則引擎（JSONPath / XPath 比對） | 實作與維護成本高；不同協定需要不同規則 |
| 每個服務獨立行程／容器 | 部署與資源成本過高，不符合工具定位 |
| 每次請求重新載入 JAR | 效能差且無法維持狀態 |

### 9.3 已知風險與技術債

| # | 項目 | 影響 | 建議 |
|---|---|---|---|
| TD-01 | 無認證授權；可上傳任意 JAR | 安全風險 | 引入 Spring Security；限制部署網路 |
| TD-02 | 變更 Publish URI 時刪除仍被引用的 JAR（KI-02） | 服務無法再啟用 | 刪檔前檢查是否仍被任何設定引用 |
| TD-03 | 開發模式 API 代理路由被刪除（KI-01） | 前端開發不便 | 恢復 API Route，或在 `next.config` 加入 `rewrites` |
| TD-05 | RESTful 註冊中途失敗不回收已註冊的對應 | 殘留路由 | 註冊失敗時逐一 `unregisterMapping` |
| TD-06 | `GlobalExceptionHandler` 參數型別錯誤；與 zipe Advice 重疊 | 錯誤格式不一致 | 統一為單一 Advice 與 `Result` 格式 |
| TD-07 | 日誌串流可路徑穿越 | 任意檔案讀取 | 正規化並限制於 `log.base` |
| TD-08 | `base-jar` 與後端程式碼重複 | 兩份需手動同步 | 將共用類別抽成獨立模組，由後端與 base-jar 共同依賴 |
| TD-09 | `BaseEntity` 未標 `@MappedSuperclass`，`UPDATED_AT` 不更新 | 稽核資訊不正確 | 補上註解並加 `@PrePersist` / `@PreUpdate` |
| TD-10 | `next.config.ts` 與 `next.config.js` 並存 | 設定可能不一致 | 保留一份 |
| TD-11 | Gradle 前端任務寫死 Windows Node（KI-05） | 無法跨平台建置 | 改用 `com.github.node-gradle.node` plugin 或依 OS 判斷 |
| TD-12 | Actuator 開放清單名稱錯誤（KI-04） | 路由查詢與健康檢查不可用 | 改為 `health,show-mappings` |
| TD-13 | 編輯流程跨多個交易 | 中途失敗留下部分變更 | 將 update 編排移入單一服務方法並標註交易 |
| TD-14 | Mock 回應修改以「刪除再新增」實作 | ID 改變、狀態重置 | 主鍵改用 `ID`，四鍵改為唯一索引 |
| TD-15 | 未使用的類別與設定（`DynamicClassLoader`、`util/JsonToXmlTest`、`SQL_UPDATE_RESPONSE`、`test-api` 頁、DTO 未用欄位） | 維護負擔 | 清理 |
| TD-16 | 自動化測試覆蓋率低 | 重構風險高 | 優先為動態載入與編輯流程補整合測試 |
| TD-17 | 預設路徑寫死 `C:/`、`D:/` | 跨平台部署需修改 | 改為相對於工作目錄的預設值 |

## 10. 附錄

### 10.1 版本歷史

2026-11-18：管理介面改為明亮版（依 `design/admin-light-redesign/`）：左側側欄＋頂列麵包屑取代 MENU 下拉，Endpoint 清單加入統計卡、狀態篩選、批次啟停與 Mock 回應筆數，Mock 回應改用右側編輯面板，操作改用自訂確認框與 toast；WSDL 轉換改為獨立頁 `/wsdl`，前端改送 `wsdlUrl` 並新增 `packageName` 欄位，修正 TD-04（KI-03），已從技術債清單移除。

2026-11-15：新增可選的 PostgreSQL 支援（預設仍為 SQLite）：加入 PostgreSQL JDBC driver 與 Flyway PostgreSQL 模組，`application.yml` 的方言與 Flyway 位置改由 `app.database.*` 決定，新增 `db.postgresql/V1.2__create_tables.sql`；尚未在實際 PostgreSQL 環境驗證。

2026-10-30：修正 Docker Compose 部署設定：改用正確的後端 JAR、受維護的 Java 17 執行環境、Spring Boot 命令列屬性與三個具名 volume，並補上 Linux 測試專用 SQLite 設定；相關容器部署技術債已從清單移除。

2026-10-27：RESTful 路由註冊器改以 `@Qualifier` 明確指定 Spring MVC Bean，修正未保留建構子參數名稱時的啟動歧義；新增雙 Bean 注入回歸測試，並同步修正舊 DAO 測試缺少服務類型參數的編譯錯誤。

| 版本 | 日期 | 說明 |
|---|---|---|
| 1.x | — | 前版 SDD（`docs/sdd.md` 與舊版網站，已移除，可從 git 歷史取得） |
| 2.0 | 2026-10-17 | 依程式碼重新整理全部章節，補上動態載入細節、API 規格、技術債清單 |

### 10.2 程式碼對照

| 主題 | 主要檔案 |
|---|---|
| Endpoint 發布 | `backend/src/main/java/com/dynamicapi/util/WebServiceHandler.java` |
| RESTful 註冊 | `backend/src/main/java/com/dynamicapi/service/impl/DynamicControllerServiceImpl.java` |
| 啟動恢復 | `backend/src/main/java/com/dynamicapi/setup/` |
| Mock 查詢 | `backend/src/main/java/com/dynamicapi/dao/MockResponseDao.java` |
| 資料表 | `backend/src/main/resources/db.migration/`（SQLite）、`db.postgresql/`（PostgreSQL） |
| 前端 API | `nextjs-dynamic-api-manager/src/services/` |
| 建置整合 | `backend/build.gradle` |
