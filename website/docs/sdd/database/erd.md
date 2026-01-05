---
sidebar_position: 1
---

# 概念資料模型（ERD）

## 實體與關係圖（ERD）

```
┌─────────────────┐          ┌──────────────────┐
│    JAR_FILE     │          │    ENDPOINT      │
├─────────────────┤          ├──────────────────┤
│ id (PK)         │◄────────┤│ id (PK)          │
│ file_name       │ 1      * │ publish_uri (UK) │
│ file_content    │          │ bean_name (UK)   │
│ status          │          │ class_path       │
│ upload_time     │          │ jar_file_id (FK) │
└─────────────────┘          │ is_active        │
                             └──────────────────┘

┌─────────────────┐          ┌──────────────────┐
│    JAR_FILE     │          │   CONTROLLER     │
├─────────────────┤          ├──────────────────┤
│ id (PK)         │◄────────┤│ id (PK)          │
│ file_name       │ 1      * │ publish_uri (UK) │
│ file_content    │          │ class_path       │
│ status          │          │ jar_file_id (FK) │
│ upload_time     │          │ is_active        │
└─────────────────┘          └──────────────────┘

┌──────────────────────────────┐
│      MOCK_RESPONSE           │
├──────────────────────────────┤
│ publish_uri (PK)             │
│ method (PK)                  │
│ condition (PK)               │
│ service_type (PK)            │
│ response_content             │
│ is_active                    │
└──────────────────────────────┘
```

---

## 實體說明

### 1. JAR_FILE（JAR 檔案實體）

**職責**：儲存上傳的 JAR 檔案與狀態資訊

**關鍵屬性**：
- `id`：主鍵，自動遞增
- `file_name`：檔案名稱，唯一約束
- `file_content`：BLOB 欄位，儲存 JAR 二進制內容
- `status`：枚舉值（UNUSED / INUSED），追蹤使用狀態
- `upload_time`：上傳時間戳記

**業務規則**：
- 檔案名稱不可重複
- 狀態為 `INUSED` 的檔案不可刪除
- 檔案大小限制：最大 50MB

---

### 2. ENDPOINT（WSDL Web Service 端點實體）

**職責**：儲存 WSDL Endpoint 配置資訊

**關鍵屬性**：
- `id`：主鍵，自動遞增
- `publish_uri`：發布路徑，唯一約束（如：`/ws/company`）
- `bean_name`：Spring Bean 名稱，唯一約束
- `class_path`：完整類別路徑（如：`com.company.webservice.impl.CompanyWebServiceImpl`）
- `jar_file_id`：外鍵，關聯到 JAR_FILE
- `is_active`：布林值，表示是否已啟用
- `create_time`：建立時間戳記

**業務規則**：
- `publish_uri` 與 `bean_name` 不可重複
- 啟用時需從 JAR 載入對應的類別
- 停用時需卸載 Web Service
- 刪除時需先停用

---

### 3. CONTROLLER（RESTful API Controller 實體）

**職責**：儲存 RESTful Controller 配置資訊

**關鍵屬性**：
- `id`：主鍵，自動遞增
- `publish_uri`：發布路徑，唯一約束（如：`/api/company`）
- `class_path`：完整類別路徑（如：`com.company.controller.CompanyController`）
- `jar_file_id`：外鍵，關聯到 JAR_FILE
- `is_active`：布林值，表示是否已啟用
- `create_time`：建立時間戳記

**業務規則**：
- `publish_uri` 不可重複
- 啟用時需從 JAR 載入對應的類別並註冊到 Spring MVC
- 停用時需卸載路由
- 刪除時需先停用

---

### 4. MOCK_RESPONSE（Mock 回應規則實體）

**職責**：儲存 Mock 回應規則與內容

**關鍵屬性**：
- `publish_uri`：主鍵之一，發布路徑
- `method`：主鍵之一，方法名稱或 HTTP Method（如：`getCompanyInfo`、`POST`、`GET`）
- `condition`：主鍵之一，匹配條件（如：`companyId=001`、`default`）
- `service_type`：主鍵之一，服務類型（`ENDPOINT` 或 `RESTFUL`）
- `response_content`：TEXT 欄位，儲存回應內容（XML 或 JSON 格式）
- `is_active`：布林值，表示規則是否啟用
- `create_time`：建立時間戳記

**業務規則**：
- 複合主鍵（publish_uri + method + condition + service_type）確保規則唯一性
- `condition = 'default'` 表示預設回應（當其他條件不匹配時使用）
- `is_active = false` 的規則不參與匹配
- 回應內容格式需與 `service_type` 一致（ENDPOINT 通常使用 XML，RESTFUL 使用 JSON）

---

## 關係說明

### JAR_FILE ↔ ENDPOINT（一對多）

**關係類型**：一對多

**說明**：
- 一個 JAR 檔案可以被多個 Endpoint 使用
- 一個 Endpoint 僅關聯到一個 JAR 檔案

**外鍵**：
- `ENDPOINT.jar_file_id` → `JAR_FILE.id`

**級聯規則**：
- 刪除 JAR 檔案時，需先刪除所有關聯的 Endpoint
- 或：設定為 `ON DELETE RESTRICT`（禁止刪除使用中的 JAR）

---

### JAR_FILE ↔ CONTROLLER（一對多）

**關係類型**：一對多

**說明**：
- 一個 JAR 檔案可以被多個 Controller 使用
- 一個 Controller 僅關聯到一個 JAR 檔案

**外鍵**：
- `CONTROLLER.jar_file_id` → `JAR_FILE.id`

**級聯規則**：
- 刪除 JAR 檔案時，需先刪除所有關聯的 Controller
- 或：設定為 `ON DELETE RESTRICT`（禁止刪除使用中的 JAR）

---

### MOCK_RESPONSE ↔ ENDPOINT/CONTROLLER（邏輯關聯）

**關係類型**：邏輯關聯（無外鍵）

**說明**：
- Mock Response 透過 `publish_uri` 與 `service_type` 邏輯關聯到 Endpoint 或 Controller
- 沒有資料庫層級的外鍵約束
- 允許在 Endpoint/Controller 建立前預先建立 Mock Response

**查詢關聯**：
```sql
-- 查詢 Endpoint 的所有 Mock Response
SELECT * FROM mock_response
WHERE publish_uri = '/ws/company'
  AND service_type = 'ENDPOINT';

-- 查詢 Controller 的所有 Mock Response
SELECT * FROM mock_response
WHERE publish_uri = '/api/company'
  AND service_type = 'RESTFUL';
```

---

## 資料完整性約束

### 主鍵約束

| 表格 | 主鍵 | 說明 |
|------|------|------|
| JAR_FILE | id | 自動遞增整數 |
| ENDPOINT | id | 自動遞增整數 |
| CONTROLLER | id | 自動遞增整數 |
| MOCK_RESPONSE | (publish_uri, method, condition, service_type) | 複合主鍵 |

### 唯一約束

| 表格 | 唯一欄位 | 說明 |
|------|---------|------|
| JAR_FILE | file_name | 檔案名稱不可重複 |
| ENDPOINT | publish_uri | 發布路徑不可重複 |
| ENDPOINT | bean_name | Bean 名稱不可重複 |
| CONTROLLER | publish_uri | 發布路徑不可重複 |

### 外鍵約束

| 子表 | 外鍵欄位 | 父表 | 參考欄位 | 級聯規則 |
|------|---------|------|---------|---------|
| ENDPOINT | jar_file_id | JAR_FILE | id | ON DELETE RESTRICT |
| CONTROLLER | jar_file_id | JAR_FILE | id | ON DELETE RESTRICT |

### 非空約束

所有表格的主鍵與關鍵業務欄位（如：`publish_uri`、`class_path`、`status`）都設定為 `NOT NULL`。

---

## 索引設計

### 主鍵索引（自動建立）

- `JAR_FILE(id)`
- `ENDPOINT(id)`
- `CONTROLLER(id)`
- `MOCK_RESPONSE(publish_uri, method, condition, service_type)`

### 唯一索引

- `JAR_FILE(file_name)` - 快速檢查檔案名稱重複
- `ENDPOINT(publish_uri)` - 快速檢查 URI 重複
- `ENDPOINT(bean_name)` - 快速檢查 Bean 名稱重複
- `CONTROLLER(publish_uri)` - 快速檢查 URI 重複

### 外鍵索引

- `ENDPOINT(jar_file_id)` - 加速 JOIN 查詢
- `CONTROLLER(jar_file_id)` - 加速 JOIN 查詢

### 查詢索引

- `MOCK_RESPONSE(publish_uri, service_type)` - 加速依 URI 與服務類型查詢

---

## 資料量估算

### 預估資料量（1 年）

| 表格 | 預估筆數 | 平均大小 | 總大小 |
|------|---------|---------|--------|
| JAR_FILE | 100 | 5 MB/筆 | 500 MB |
| ENDPOINT | 50 | 1 KB/筆 | 50 KB |
| CONTROLLER | 50 | 1 KB/筆 | 50 KB |
| MOCK_RESPONSE | 500 | 5 KB/筆 | 2.5 MB |
| **總計** | **700** | - | **~503 MB** |

### 增長趨勢

- **JAR_FILE**：每月新增 5-10 個檔案
- **ENDPOINT/CONTROLLER**：每月新增 3-5 個端點
- **MOCK_RESPONSE**：每月新增 20-50 個規則

---

## 相關文件

- [資料表 Schema](./schema) - 詳細的欄位定義與 DDL
- [資料一致性策略](./consistency) - 交易管理與一致性保證
