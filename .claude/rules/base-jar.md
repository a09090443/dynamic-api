---
paths:
  - "base-jar/**"
  - "backend/src/main/java/com/dynamicapi/jarbase/**"
  - "backend/src/main/java/com/dynamicapi/dao/**"
  - "backend/src/main/java/com/dynamicapi/jdbc/BaseJDBCAdapter.java"
  - "backend/src/main/java/com/dynamicapi/jdbc/MockResponseJDBC.java"
  - "backend/src/main/java/com/dynamicapi/enums/ServiceType.java"
---

# base-jar 與基底類別 API

## 兩份程式碼必須一致

下列類別在 `base-jar/src/main/java/com/dynamicapi/` 與 `backend/src/main/java/com/dynamicapi/` 各有一份，內容必須**完全相同**：

| 類別 |
|---|
| `jarbase/RestfulBase.java`、`jarbase/WebserviceBase.java` |
| `dao/MockResponseDao.java` |
| `jdbc/BaseJDBCAdapter.java`、`jdbc/MockResponseJDBC.java` |
| `enums/ServiceType.java` |

修改其中一份時，同一個變更要套用到另一份，並用 `diff` 確認一致。執行期以後端版本為準（父優先 ClassLoader），`base.jar` 只用於使用者 JAR 編譯。

## 這是對外公開的 API

已上傳的使用者 JAR 是針對這些簽章編譯的，後端更新後不會重新編譯。因此：

- **不可**刪除或變更 `protected <T> T findByPrimaryKey(String publishUri, String method, String condition, Class<T> clazz)` 的簽章，也不可改變其語意（四鍵完全相等、只查 `IS_ACTIVE = TRUE`、查無時回傳 `clazz` 的無參數實例，`String` 為 `""`）。
- **不可**更改 `protected MockResponseDao mockResponseDao` 欄位名稱與可見度；範例 `CompanyWebServiceImpl` 直接使用它。
- `setMockResponseDao` 維持 `@Autowired` 與 `final`。
- `ServiceType` 的列舉名稱 `RESTFUL`、`ENDPOINT` 會寫入資料庫，不可改名。
- 只允許**新增**方法；需要不相容變更時，新增新方法並保留舊方法。

## 變更後

1. `cd base-jar && .\gradlew.bat jar`，把 `build/libs/*-plain.jar` 複製到範例專案的 `src/main/lib/base.jar`（`endpoints/company-endpoint`、`restfuls/company-restful`）。
2. 更新 `docs-site/docs/jar-dev/base-jar.md`。
