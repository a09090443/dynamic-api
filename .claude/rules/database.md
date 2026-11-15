---
paths:
  - "backend/src/main/resources/db.migration/**"
  - "backend/src/main/resources/db.postgresql/**"
  - "backend/src/main/resources/sql/**"
  - "backend/src/main/java/com/dynamicapi/entity/**"
  - "backend/src/main/java/com/dynamicapi/repository/**"
  - "backend/src/main/java/com/dynamicapi/jdbc/**"
  - "backend/src/main/java/com/dynamicapi/model/**"
  - "backend/src/main/java/com/dynamicapi/converter/**"
---

# 資料庫（SQLite / PostgreSQL + Flyway + JPA/JDBC）

資料設計：`docs-site/docs/sdd/data.md`。

## Flyway 遷移

- **已存在的 `V*.sql` 一律不可修改**（已部署環境會因 checksum 不符而啟動失敗）。結構變更時，SQLite 的 `classpath:db.migration` 與 PostgreSQL 的 `classpath:db.postgresql` 都要新增相同版本的下一支腳本；目前最新為 `V1.2`，下一個是 `V1.3__<說明>.sql`。
- SQLite 腳本位於 `classpath:db.migration`（目錄名稱含點，不是 `db/migration`）；PostgreSQL 腳本位於 `classpath:db.postgresql`。兩個位置由 `app.database.flyway-locations` 擇一使用，不可讓同一種資料庫同時執行兩套腳本。
- SQLite 限制（只適用 `db.migration`）：`ALTER TABLE` 只支援 `ADD COLUMN`、`RENAME COLUMN`、`RENAME TO`。修改型別、刪除欄位或約束時，用「建新表 → `INSERT ... SELECT` → `DROP` 舊表 → `RENAME`」。
- `ADD COLUMN` 的 `NOT NULL` 欄位必須給 `DEFAULT`。
- 欄位命名使用大寫底線；Publish URI 欄位一律是 `PUBLISH_URI`（V1.2 已從 `PUBLISH_URL` 更名，勿再使用舊名）。
- PostgreSQL 的布林欄位使用 `BOOLEAN`（啟用預設值為 `TRUE`，停用預設值為 `FALSE`）；`CREATED_AT` / `UPDATED_AT` 目前維持 `TEXT`，與既有資料存取行為一致。
- PostgreSQL 腳本的識別字不要加雙引號，讓 PostgreSQL、Hibernate 與具名 SQL 都以不區分大小寫的未加引號名稱存取。
- 資料表之間沒有外鍵約束，一致性由應用程式維護；新增關聯時沿用此慣例，或在遷移中明確加上並處理既有資料。

## JPA 實體

- `ENDPOINT`、`CONTROLLER` 的 `@Id` 是 `publishUri`，`ID` 欄位對應 `uuId` 屬性（每次 save 都會重新產生）。前端以 `id` 識別、後端以 `publishUri` 為主鍵，兩者都不能拿掉。
- `MOCK_RESPONSE` 的主鍵是 `@EmbeddedId MockResponseId`（`publishUri, method, condition, serviceType`）。對已存在的鍵 `save` 會 merge 覆寫，不會報衝突。
- `BaseEntity` 沒有 `@MappedSuperclass`，`CREATED_AT` / `UPDATED_AT` 實際上沒有被 JPA 對應（TD-09）。若要修正，記得 V1.0 的欄位是 `TEXT` 型別。
- `JarFileEntity.status` 透過 `JarFileStatusConverter` 存成 `A` / `I` / `D`；新增狀態時要同時改 enum 與 converter。
- 布林欄位在 SQLite 中是 `INTEGER` 0/1，在 PostgreSQL 中是 `BOOLEAN`。

## 具名 SQL（`resources/sql/`）

- 檔名必須等於對應 `*JDBC` 類別中的常數值（例如 `MockResponseJDBC.SQL_SELECT_RESPONSE_CONTENT` ↔ `SQL_SELECT_RESPONSE_CONTENT.sql`），由 `ResourceEnum.SQL.getResource(...)` 載入。
- 參數使用 `:name` 具名參數；動態條件使用 `${CONDITIONS}` 佔位，搭配 `Conditions` 組合。
- `SQL_SELECT_RESPONSE_CONTENT.sql` 是執行期 Mock 查詢的核心，修改前先讀 `.claude/rules/base-jar.md` 的相容性要求。

## 變更後

- 啟動後端確認所選資料庫的 Flyway 執行成功。PostgreSQL 支援目前尚未在實際 PostgreSQL 環境驗證，有環境後仍須驗證連線、建表與 Mock 命中。
- 更新 `docs-site/docs/sdd/data.md`（ERD、資料表、遷移清單）。
