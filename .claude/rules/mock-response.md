---
paths:
  - "backend/src/main/java/com/dynamicapi/service/impl/CommonServiceImpl.java"
  - "backend/src/main/java/com/dynamicapi/service/CommonService.java"
  - "backend/src/main/java/com/dynamicapi/repository/MockResponseRepository.java"
  - "backend/src/main/java/com/dynamicapi/entity/MockResponse*.java"
  - "backend/src/main/resources/sql/*RESPONSE*.sql"
  - "nextjs-dynamic-api-manager/src/app/response/**"
---

# Mock 回應語意

說明：`docs-site/docs/sdd/mock-engine.md`、`docs-site/docs/guide/mock-response.md`。

下列行為是使用者（測試人員、JAR 作者）依賴且寫進文件的語意。修改任何一項，都要同步更新使用者指南、SRS（`FR-MR-*`、`BR-*`）與 SDD。

| 行為 | 目前實作 |
|---|---|
| 命中條件 | `PUBLISH_URI`、`METHOD`、`CONDITION`、`SERVICE_TYPE` 四鍵完全相等，且 `IS_ACTIVE = TRUE`；不做任何正規化 |
| 新增 | 產生 UUID 作為 `ID`，`IS_ACTIVE=false` |
| 編輯 | 因 `CONDITION` 是主鍵一部分，以「依 `ID` 刪除 → 重新新增」實作；結果 `ID` 改變、回到停用 |
| 鍵值重複 | JPA `save` 會覆寫既有那筆 |
| Publish URI 連動 | `SQL_UPDATE_PUBLISH_URI_FOR_RESPONSE` 依 URI 整批更新，不分 `SERVICE_TYPE` |
| 刪除服務 | 不刪除其 Mock 回應 |
| 切換狀態 | 例外被吞掉，API 一律回傳成功 |

## 注意

- `getResponseList` 需同時帶 `publishUri` 與 `serviceType`；`serviceType` 為 null 時 JPA 衍生查詢會變成 `IS NULL`，回傳空清單。
- 執行期查詢走 `MockResponseDao` + `SQL_SELECT_RESPONSE_CONTENT.sql`，不是 `MockResponseRepository`；兩條路徑的條件要保持一致。
- 前端 Response 頁的 `publishUri`、`serviceType` 來自 query string，由 Endpoint／RESTful 頁的「回應清單」按鈕帶入。
- 主鍵改為 `ID`（TD-14）屬於資料結構變更，需要新的 Flyway 遷移，見 `.claude/rules/database.md`。
