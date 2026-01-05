---
sidebar_position: 4
---

# Mock 回應管理模組

本模組負責 Mock 回應規則的建立、編輯、刪除、啟用/停用與查詢功能。

---

## FR-MR-001：新增 Mock 回應規則

### 描述
系統應允許建立 Mock 回應規則，根據條件返回預設回應。

### 觸發者（Actor）
- 測試人員
- 開發人員

### 前置條件
- 對應的 Endpoint 或 Restful 已存在

### 後置條件
- Mock Response 記錄儲存到 `mock_response` 表
- 預設為啟用狀態（`is_active = true`）

### 輸入／輸出

**輸入**：
- Publish URI（如：`/ws/company` 或 `/api/company`）
- Method（如：`getCompanyInfo`、`POST`、`GET`）
- Condition（如：`companyId=001`、`default`）
- Service Type（`ENDPOINT` 或 `RESTFUL`）
- Response Content（XML 或 JSON 格式）

**輸出**：
- 建立成功／失敗訊息

### 業務規則

:::warning 複合主鍵
複合主鍵（publish_uri, method, condition, service_type）不可重複
:::

- Response Content 必須是有效的 XML 或 JSON（根據 Service Type）
- Condition 為 `default` 時作為預設回應（當其他條件不匹配時使用）

### 驗收標準

✅ **成功情境**：
- 成功新增後可在回應清單中看到該筆記錄

❌ **失敗情境**：
- 重複的規則時顯示錯誤訊息
- 無效的 XML/JSON 格式時顯示錯誤訊息

---

## FR-MR-002：編輯 Mock 回應規則

### 描述
系統應允許編輯既有的 Mock 回應規則。

### 觸發者（Actor）
- 測試人員
- 開發人員

### 前置條件
- Mock Response 記錄存在

### 後置條件
- Mock Response 內容更新

### 輸入／輸出

**輸入**：
- 主鍵（publish_uri, method, condition, service_type）
- 新的 Response Content

**輸出**：
- 更新成功／失敗訊息

### 業務規則

:::warning 主鍵不可變更
不可更改主鍵欄位（若需更改，應刪除後重建）
:::

- Response Content 必須是有效的 XML 或 JSON

### 驗收標準

✅ **成功情境**：
- 更新後內容正確顯示
- 呼叫對應的 API/Web Service 時返回新的回應內容

---

## FR-MR-003：刪除 Mock 回應規則

### 描述
系統應允許刪除 Mock 回應規則。

### 觸發者（Actor）
- 測試人員
- 開發人員

### 前置條件
- Mock Response 記錄存在

### 後置條件
- Mock Response 記錄從資料庫中移除

### 輸入／輸出

**輸入**：
- 主鍵（publish_uri, method, condition, service_type）

**輸出**：
- 刪除成功／失敗訊息

### 業務規則

- 刪除前需顯示確認訊息

### 驗收標準

✅ **成功情境**：
- 成功刪除後記錄不再出現在清單中
- 呼叫對應的 API/Web Service 時不再匹配該規則

---

## FR-MR-004：啟用／停用 Mock 回應規則

### 描述
系統應允許切換 Mock 回應規則的啟用狀態。

### 觸發者（Actor）
- 測試人員
- 開發人員

### 前置條件
- Mock Response 記錄存在

### 後置條件
- `is_active` 狀態更新

### 輸入／輸出

**輸入**：
- 主鍵（publish_uri, method, condition, service_type）

**輸出**：
- 切換成功／失敗訊息

### 業務規則

:::note 優先級規則
- 停用的規則不會被匹配
- 啟用的規則優先於 `default` 規則
:::

### 驗收標準

✅ **成功情境**：
- 停用後呼叫 API/Web Service 不會匹配該規則
- 啟用後恢復匹配

---

## FR-MR-005：查詢 Mock 回應清單

### 描述
系統應提供 Mock 回應清單查詢，支援依 Publish URI 與 Service Type 篩選。

### 觸發者（Actor）
- 測試人員
- 開發人員

### 前置條件
- 無

### 後置條件
- 返回 Mock Response 清單

### 輸入／輸出

**輸入**：
- 篩選條件（Publish URI、Service Type）

**輸出**：
- Publish URI
- Method
- Condition
- Service Type
- 狀態
- 建立時間

### 業務規則

- 清單依 Publish URI 與 Method 排序
- Response Content 不在清單中顯示（僅在編輯時顯示）

### 驗收標準

✅ **成功情境**：
- 可正確顯示所有 Mock Response
- 篩選功能正常運作
- 狀態正確顯示
