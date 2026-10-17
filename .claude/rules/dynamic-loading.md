---
paths:
  - "backend/src/main/java/com/dynamicapi/util/WebServiceHandler.java"
  - "backend/src/main/java/com/dynamicapi/util/DynamicBeanUtil.java"
  - "backend/src/main/java/com/dynamicapi/service/impl/DynamicWebServiceImpl.java"
  - "backend/src/main/java/com/dynamicapi/service/impl/DynamicControllerServiceImpl.java"
  - "backend/src/main/java/com/dynamicapi/service/impl/BaseService.java"
  - "backend/src/main/java/com/dynamicapi/setup/**"
  - "backend/src/main/java/com/dynamicapi/enums/ClassLoaderSingletonEnum.java"
  - "backend/src/main/java/com/dynamicapi/interceptor/**"
---

# 動態載入核心

設計說明：`docs-site/docs/sdd/dynamic-loading.md`。

## 不可破壞的約定

- **ClassLoader 登錄鍵**固定為 `{publishUri}_webservice`（Endpoint）與 `{publishUri}_controller`（RESTful）。註冊、取得、移除三處必須使用相同格式。
- **ClassLoader 一律用 zipe 的 `CustomClassLoader`，父載入器為 `this.getClass().getClassLoader()`**（父優先）。不要改成子優先：使用者 JAR 依賴後端提供的 `RestfulBase`、`MockResponseDao` 必須是同一個 `Class` 物件，注入才會成功。`util/DynamicClassLoader` 目前未使用。
- **註冊與撤銷必須對稱**：
  - RESTful：`disabledController` 以和 `startUpControllerProcess` 相同的 `getMappingForMethod` 規則重算 `RequestMappingInfo` 再 `unregisterMapping`。修改其中一邊的路徑組合或註解支援時，另一邊要一起改。
  - Endpoint：撤銷依 `ServerRegistry` 中位址「以 publishUri 結尾」比對，Publish URI 命名若互為後綴會誤刪。
- **失敗必須清理**：載入或發布失敗時要從 `ClassLoaderSingletonEnum` 移除並 `close()` ClassLoader，DB 的 `IS_ACTIVE` 維持 0。只有在 JVM 端成功後才把 `IS_ACTIVE` 寫成 1。
- **撤銷順序**：先停止服務／取消對應 → 從登錄表移除 → `unloadJarFile` → `close()`。`close()` 之後 Windows 才能刪除 JAR 檔。
- **Endpoint 的 Bean 以同名重新註冊**，依賴 `application.yml` 的 `spring.main.allow-bean-definition-overriding: true`，不可關閉。
- **RESTful 路徑驗證**：類別 `@RequestMapping` 第一段必須等於 Publish URI。這是對使用者公開的規則（文件多處引用），不要放寬或改成其他規則而不更新文件。
- **啟動恢復**（`setup/`）：單一服務失敗不可中斷整個迴圈，失敗者寫回 `IS_ACTIVE=false` 並記錄日誌。
- JAR 路徑一律為 `"file:" + jar.file.dir + 檔名`（`jar.file.dir` 結尾含 `/`）。

## 已知技術債（修改附近程式碼時注意，勿擴大）

- TD-02：變更 Publish URI 時會把仍被引用的 JAR 標為 `D` 並刪檔（流程在 `WebServiceController` / `DynamicLoadController` 的 update）。
- TD-05：RESTful 註冊中途失敗不會回收已註冊的對應。
- 修正上述問題時，同步更新 `docs-site` 中的已知問題清單（`guide/troubleshooting.md`、`srs/acceptance.md`、`sdd/decisions.md`）。

## 驗證

這些行為沒有單元測試覆蓋。修改後請以範例 JAR 手動驗證：建立 → 啟用 → 呼叫 → 停用 → 再啟用 → 重啟後端後仍可呼叫。
