---
sidebar_position: 2
---

# Endpoint 管理模組（WSDL Web Service）

本模組負責 WSDL Endpoint 的建立、啟用、停用、編輯、刪除與查詢功能。

---

## FR-EP-001：新增 Endpoint

### 描述
系統應允許建立 WSDL Endpoint 配置，關聯 JAR 檔案與類別資訊。

### 觸發者（Actor）
- 開發人員

### 前置條件
- 已上傳包含 Web Service 實作的 JAR 檔案
- JAR 中的類別繼承自 `WebserviceBase`

### 後置條件
- Endpoint 記錄儲存到 `endpoint` 表
- JAR 檔案狀態更新為 `INUSED`
- Endpoint 預設為停用狀態（`is_active = false`）

### 輸入／輸出

**輸入**：
- Publish URI（如：`/ws/company`）
- Bean Name（Spring Bean 名稱）
- Class Path（完整類別路徑，如：`com.company.webservice.impl.CompanyWebServiceImpl`）
- JAR File ID

**輸出**：
- Endpoint ID
- 建立時間

### 業務規則

:::warning 唯一性約束
- Publish URI 不可重複
- Bean Name 不可重複
:::

- Publish URI 必須以 `/` 開頭
- Class Path 必須是 JAR 中存在的類別

### 驗收標準

✅ **成功情境**：
- 成功新增後可在 Endpoint 清單中看到該筆記錄

❌ **失敗情境**：
- 重複 Publish URI 時顯示錯誤訊息
- 無效的 Class Path 時顯示錯誤訊息

---

## FR-EP-002：啟用 Endpoint

### 描述
系統應將停用的 Endpoint 啟用，動態載入 JAR 並發布 Web Service。

### 觸發者（Actor）
- 開發人員
- 維運人員

### 前置條件
- Endpoint 存在且為停用狀態
- 關聯的 JAR 檔案存在

### 後置條件
- Endpoint 狀態更新為 `is_active = true`
- 從 JAR 載入指定的類別
- 使用 Apache CXF 在指定的 Publish URI 發布 Web Service
- 外部系統可透過 WSDL 存取服務

### 輸入／輸出

**輸入**：
- Endpoint ID

**輸出**：
- 啟用成功／失敗訊息

### 業務規則

:::note 唯一性保證
同一 Publish URI 僅能有一個啟用的 Endpoint
:::

- 載入失敗時需回滾狀態變更

### 驗收標準

✅ **成功情境**：
- 啟用成功後狀態顯示為「已啟用」
- 可透過 `http://localhost:8080/{publishUri}?wsdl` 存取 WSDL
- 呼叫 Web Service 可正確返回回應

❌ **失敗情境**：
- 啟用失敗時顯示詳細錯誤訊息（如：類別載入失敗、CXF 發布失敗）

---

## FR-EP-003：停用 Endpoint

### 描述
系統應將啟用的 Endpoint 停用，卸載 Web Service。

### 觸發者（Actor）
- 開發人員
- 維運人員

### 前置條件
- Endpoint 存在且為啟用狀態

### 後置條件
- Endpoint 狀態更新為 `is_active = false`
- 使用 Apache CXF 停止發布 Web Service
- 外部系統無法再存取該服務

### 輸入／輸出

**輸入**：
- Endpoint ID

**輸出**：
- 停用成功／失敗訊息

### 業務規則

:::tip 可重新啟用
停用不會刪除 Endpoint 記錄，停用後可重新啟用
:::

### 驗收標準

✅ **成功情境**：
- 停用成功後狀態顯示為「已停用」
- 存取 WSDL 時返回 404 錯誤

❌ **失敗情境**：
- 停用失敗時顯示錯誤訊息

---

## FR-EP-004：編輯 Endpoint

### 描述
系統應允許編輯已停用的 Endpoint 配置。

### 觸發者（Actor）
- 開發人員

### 前置條件
- Endpoint 存在
- Endpoint 為停用狀態（<!-- TODO: 是否允許編輯啟用中的 Endpoint？ -->）

### 後置條件
- Endpoint 配置更新

### 輸入／輸出

**輸入**：
- Endpoint ID
- 新的 Bean Name / Class Path / JAR File ID

**輸出**：
- 更新成功／失敗訊息

### 業務規則

:::warning 限制
不可更改 Publish URI（若需更改，應刪除後重建）
:::

- 新的 Bean Name 不可與其他 Endpoint 重複

### 驗收標準

✅ **成功情境**：
- 更新後資訊正確顯示
- 重新啟用後使用新的配置

---

## FR-EP-005：刪除 Endpoint

### 描述
系統應允許刪除已停用的 Endpoint。

### 觸發者（Actor）
- 開發人員

### 前置條件
- Endpoint 存在
- Endpoint 為停用狀態

### 後置條件
- Endpoint 記錄從資料庫中移除
- 若 JAR 檔案不再被其他 Endpoint/Restful 使用，狀態更新為 `UNUSED`

### 輸入／輸出

**輸入**：
- Endpoint ID

**輸出**：
- 刪除成功／失敗訊息

### 業務規則

:::warning 刪除限制
啟用中的 Endpoint 不可刪除
:::

- 刪除前需顯示確認訊息

### 驗收標準

✅ **成功情境**：
- 成功刪除後記錄不再出現在清單中

❌ **失敗情境**：
- 嘗試刪除啟用中的 Endpoint 時顯示錯誤訊息

---

## FR-EP-006：查詢 Endpoint 清單

### 描述
系統應提供 Endpoint 清單查詢，顯示所有 Endpoint 配置與狀態。

### 觸發者（Actor）
- 開發人員
- 測試人員
- 維運人員

### 前置條件
- 無

### 後置條件
- 返回 Endpoint 清單

### 輸入／輸出

**輸入**：
- 無（或篩選條件：狀態、JAR 檔案）

**輸出**：
- Endpoint ID
- Publish URI
- Bean Name
- 狀態
- JAR 檔案名稱
- 建立時間

### 業務規則

- 清單依建立時間倒序排列
- 狀態以視覺化方式顯示（如：綠色=已啟用、灰色=已停用）

### 驗收標準

✅ **成功情境**：
- 可正確顯示所有 Endpoint
- 篩選功能正常運作
- 狀態正確顯示
