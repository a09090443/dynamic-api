---
sidebar_position: 3
---

# Restful 管理模組（RESTful API Controller）

本模組負責 RESTful API Controller 的建立、啟用、停用、編輯、刪除與查詢功能。

---

## FR-RF-001：新增 Restful Controller

### 描述
系統應允許建立 Restful Controller 配置，關聯 JAR 檔案與類別資訊。

### 觸發者（Actor）
- 開發人員

### 前置條件
- 已上傳包含 RestController 實作的 JAR 檔案
- JAR 中的類別繼承自 `RestfulBase`

### 後置條件
- Controller 記錄儲存到 `controller` 表
- JAR 檔案狀態更新為 `INUSED`
- Controller 預設為停用狀態（`is_active = false`）

### 輸入／輸出

**輸入**：
- Publish URI（如：`/api/company`）
- Class Path（完整類別路徑，如：`com.company.controller.CompanyController`）
- JAR File ID

**輸出**：
- Controller ID
- 建立時間

### 業務規則

:::warning 唯一性約束
Publish URI 不可重複
:::

- Publish URI 必須以 `/` 開頭
- Class Path 必須是 JAR 中存在的類別
- 類別必須有 `@RestController` 或 `@Controller` 註解

### 驗收標準

✅ **成功情境**：
- 成功新增後可在 Restful 清單中看到該筆記錄

❌ **失敗情境**：
- 重複 Publish URI 時顯示錯誤訊息
- 無效的 Class Path 時顯示錯誤訊息

---

## FR-RF-002：啟用 Restful Controller

### 描述
系統應將停用的 Controller 啟用，動態載入 JAR 並註冊到 Spring MVC。

### 觸發者（Actor）
- 開發人員
- 維運人員

### 前置條件
- Controller 存在且為停用狀態
- 關聯的 JAR 檔案存在

### 後置條件
- Controller 狀態更新為 `is_active = true`
- 從 JAR 載入指定的類別
- 使用 `RequestMappingHandlerMapping` 動態註冊 Controller
- 外部系統可透過 HTTP 存取 API

### 輸入／輸出

**輸入**：
- Controller ID

**輸出**：
- 啟用成功／失敗訊息

### 業務規則

:::note 唯一性保證
同一 Publish URI 僅能有一個啟用的 Controller
:::

- 載入失敗時需回滾狀態變更

### 驗收標準

✅ **成功情境**：
- 啟用成功後狀態顯示為「已啟用」
- 可透過 HTTP Client 呼叫 API 並取得回應

❌ **失敗情境**：
- 啟用失敗時顯示詳細錯誤訊息（如：類別載入失敗、路由註冊失敗）

---

## FR-RF-003：停用 Restful Controller

### 描述
系統應將啟用的 Controller 停用，卸載 API 路由。

### 觸發者（Actor）
- 開發人員
- 維運人員

### 前置條件
- Controller 存在且為啟用狀態

### 後置條件
- Controller 狀態更新為 `is_active = false`
- 從 `RequestMappingHandlerMapping` 卸載路由
- 外部系統無法再存取該 API

### 輸入／輸出

**輸入**：
- Controller ID

**輸出**：
- 停用成功／失敗訊息

### 業務規則

:::tip 可重新啟用
停用不會刪除 Controller 記錄，停用後可重新啟用
:::

### 驗收標準

✅ **成功情境**：
- 停用成功後狀態顯示為「已停用」
- 存取 API 時返回 404 錯誤

❌ **失敗情境**：
- 停用失敗時顯示錯誤訊息

---

## FR-RF-004：編輯 Restful Controller

### 描述
系統應允許編輯已停用的 Controller 配置。

### 觸發者（Actor）
- 開發人員

### 前置條件
- Controller 存在
- Controller 為停用狀態

### 後置條件
- Controller 配置更新

### 輸入／輸出

**輸入**：
- Controller ID
- 新的 Class Path / JAR File ID

**輸出**：
- 更新成功／失敗訊息

### 業務規則

:::warning 限制
不可更改 Publish URI（若需更改，應刪除後重建）
:::

### 驗收標準

✅ **成功情境**：
- 更新後資訊正確顯示
- 重新啟用後使用新的配置

---

## FR-RF-005：刪除 Restful Controller

### 描述
系統應允許刪除已停用的 Controller。

### 觸發者（Actor）
- 開發人員

### 前置條件
- Controller 存在
- Controller 為停用狀態

### 後置條件
- Controller 記錄從資料庫中移除
- 若 JAR 檔案不再被其他 Endpoint/Restful 使用，狀態更新為 `UNUSED`

### 輸入／輸出

**輸入**：
- Controller ID

**輸出**：
- 刪除成功／失敗訊息

### 業務規則

:::warning 刪除限制
啟用中的 Controller 不可刪除
:::

- 刪除前需顯示確認訊息

### 驗收標準

✅ **成功情境**：
- 成功刪除後記錄不再出現在清單中

❌ **失敗情境**：
- 嘗試刪除啟用中的 Controller 時顯示錯誤訊息

---

## FR-RF-006：查詢 Restful Controller 清單

### 描述
系統應提供 Controller 清單查詢，顯示所有 Controller 配置與狀態。

### 觸發者（Actor）
- 開發人員
- 測試人員
- 維運人員

### 前置條件
- 無

### 後置條件
- 返回 Controller 清單

### 輸入／輸出

**輸入**：
- 無（或篩選條件：狀態、JAR 檔案）

**輸出**：
- Controller ID
- Publish URI
- 狀態
- JAR 檔案名稱
- 建立時間

### 業務規則

- 清單依建立時間倒序排列
- 狀態以視覺化方式顯示

### 驗收標準

✅ **成功情境**：
- 可正確顯示所有 Controller
- 篩選功能正常運作
- 狀態正確顯示
