---
sidebar_position: 2
---

# 資料表 Schema 與 DDL

本章節提供完整的資料表定義語言（DDL），可直接用於資料庫建置。

---

## 資料庫配置

### SQLite 配置

```yaml
# application.yml
spring:
  datasource:
    url: jdbc:sqlite:database/dynamic-api.db
    driver-class-name: org.sqlite.JDBC
  jpa:
    database-platform: org.hibernate.community.dialect.SQLiteDialect
    hibernate:
      ddl-auto: none  # 使用 Flyway 管理 Schema
```

### Flyway 遷移配置

```yaml
spring:
  flyway:
    enabled: true
    locations: classpath:db/migration
    baseline-on-migrate: true
```

---

## 1. JAR_FILE 表（JAR 檔案）

### 表格說明

儲存上傳的 JAR 檔案與狀態資訊。

### DDL（建表語句）

```sql
-- V1__Create_jar_file_table.sql
CREATE TABLE IF NOT EXISTS jar_file (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    file_name VARCHAR(255) NOT NULL UNIQUE,
    file_content BLOB NOT NULL,
    status VARCHAR(10) NOT NULL DEFAULT 'UNUSED',
    upload_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 建立索引
CREATE UNIQUE INDEX IF NOT EXISTS idx_jar_file_name
ON jar_file(file_name);

-- 建立查詢索引（依狀態）
CREATE INDEX IF NOT EXISTS idx_jar_file_status
ON jar_file(status);
```

### 欄位說明

| 欄位名稱 | 型別 | 約束 | 預設值 | 說明 |
|---------|------|------|--------|------|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | - | 主鍵，自動遞增 |
| `file_name` | VARCHAR(255) | NOT NULL, UNIQUE | - | 檔案名稱，不可重複 |
| `file_content` | BLOB | NOT NULL | - | JAR 二進制內容，最大 50MB |
| `status` | VARCHAR(10) | NOT NULL | 'UNUSED' | 狀態：UNUSED（未使用）或 INUSED（使用中） |
| `upload_time` | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP | 上傳時間，自動填入 |

### 狀態值定義

| 狀態值 | 說明 | 觸發條件 |
|--------|------|---------|
| `UNUSED` | 未使用 | 初始狀態，或所有關聯的 Endpoint/Controller 都已刪除 |
| `INUSED` | 使用中 | 至少有一個 Endpoint 或 Controller 正在使用此 JAR |

### 查詢範例

```sql
-- 查詢所有已上傳的 JAR 檔案
SELECT id, file_name, status, upload_time
FROM jar_file
ORDER BY upload_time DESC;

-- 查詢未使用的 JAR 檔案
SELECT id, file_name, upload_time
FROM jar_file
WHERE status = 'UNUSED';

-- 查詢使用中的 JAR 檔案
SELECT id, file_name, upload_time
FROM jar_file
WHERE status = 'INUSED';
```

---

## 2. ENDPOINT 表（WSDL Web Service 端點）

### 表格說明

儲存 WSDL Endpoint 配置資訊。

### DDL（建表語句）

```sql
-- V2__Create_endpoint_table.sql
CREATE TABLE IF NOT EXISTS endpoint (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    publish_uri VARCHAR(255) NOT NULL UNIQUE,
    bean_name VARCHAR(255) NOT NULL UNIQUE,
    class_path VARCHAR(255) NOT NULL,
    jar_file_id INTEGER NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT 0,
    create_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (jar_file_id) REFERENCES jar_file(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

-- 建立唯一索引
CREATE UNIQUE INDEX IF NOT EXISTS idx_endpoint_publish_uri
ON endpoint(publish_uri);

CREATE UNIQUE INDEX IF NOT EXISTS idx_endpoint_bean_name
ON endpoint(bean_name);

-- 建立外鍵索引（加速 JOIN）
CREATE INDEX IF NOT EXISTS idx_endpoint_jar_file_id
ON endpoint(jar_file_id);

-- 建立查詢索引（依啟用狀態）
CREATE INDEX IF NOT EXISTS idx_endpoint_is_active
ON endpoint(is_active);
```

### 欄位說明

| 欄位名稱 | 型別 | 約束 | 預設值 | 說明 |
|---------|------|------|--------|------|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | - | 主鍵，自動遞增 |
| `publish_uri` | VARCHAR(255) | NOT NULL, UNIQUE | - | 發布路徑（如：`/ws/company`），唯一 |
| `bean_name` | VARCHAR(255) | NOT NULL, UNIQUE | - | Spring Bean 名稱，唯一 |
| `class_path` | VARCHAR(255) | NOT NULL | - | 完整類別路徑（如：`com.company.webservice.impl.CompanyWebServiceImpl`） |
| `jar_file_id` | INTEGER | NOT NULL, FOREIGN KEY | - | 關聯到 jar_file.id |
| `is_active` | BOOLEAN | NOT NULL | 0 (false) | 是否已啟用（0=停用, 1=啟用） |
| `create_time` | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP | 建立時間，自動填入 |

### 外鍵約束

```sql
FOREIGN KEY (jar_file_id) REFERENCES jar_file(id)
    ON DELETE RESTRICT  -- 禁止刪除使用中的 JAR
    ON UPDATE CASCADE   -- JAR ID 更新時自動同步
```

### 查詢範例

```sql
-- 查詢所有 Endpoint
SELECT e.id, e.publish_uri, e.bean_name, e.class_path,
       j.file_name AS jar_file_name, e.is_active, e.create_time
FROM endpoint e
INNER JOIN jar_file j ON e.jar_file_id = j.id
ORDER BY e.create_time DESC;

-- 查詢已啟用的 Endpoint
SELECT * FROM endpoint
WHERE is_active = 1;

-- 查詢特定 JAR 的所有 Endpoint
SELECT * FROM endpoint
WHERE jar_file_id = 1;
```

---

## 3. CONTROLLER 表（RESTful API Controller）

### 表格說明

儲存 RESTful Controller 配置資訊。

### DDL（建表語句）

```sql
-- V3__Create_controller_table.sql
CREATE TABLE IF NOT EXISTS controller (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    publish_uri VARCHAR(255) NOT NULL UNIQUE,
    class_path VARCHAR(255) NOT NULL,
    jar_file_id INTEGER NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT 0,
    create_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (jar_file_id) REFERENCES jar_file(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

-- 建立唯一索引
CREATE UNIQUE INDEX IF NOT EXISTS idx_controller_publish_uri
ON controller(publish_uri);

-- 建立外鍵索引（加速 JOIN）
CREATE INDEX IF NOT EXISTS idx_controller_jar_file_id
ON controller(jar_file_id);

-- 建立查詢索引（依啟用狀態）
CREATE INDEX IF NOT EXISTS idx_controller_is_active
ON controller(is_active);
```

### 欄位說明

| 欄位名稱 | 型別 | 約束 | 預設值 | 說明 |
|---------|------|------|--------|------|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | - | 主鍵，自動遞增 |
| `publish_uri` | VARCHAR(255) | NOT NULL, UNIQUE | - | 發布路徑（如：`/api/company`），唯一 |
| `class_path` | VARCHAR(255) | NOT NULL | - | 完整類別路徑（如：`com.company.controller.CompanyController`） |
| `jar_file_id` | INTEGER | NOT NULL, FOREIGN KEY | - | 關聯到 jar_file.id |
| `is_active` | BOOLEAN | NOT NULL | 0 (false) | 是否已啟用（0=停用, 1=啟用） |
| `create_time` | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP | 建立時間，自動填入 |

### 外鍵約束

```sql
FOREIGN KEY (jar_file_id) REFERENCES jar_file(id)
    ON DELETE RESTRICT  -- 禁止刪除使用中的 JAR
    ON UPDATE CASCADE   -- JAR ID 更新時自動同步
```

### 查詢範例

```sql
-- 查詢所有 Controller
SELECT c.id, c.publish_uri, c.class_path,
       j.file_name AS jar_file_name, c.is_active, c.create_time
FROM controller c
INNER JOIN jar_file j ON c.jar_file_id = j.id
ORDER BY c.create_time DESC;

-- 查詢已啟用的 Controller
SELECT * FROM controller
WHERE is_active = 1;

-- 查詢特定 JAR 的所有 Controller
SELECT * FROM controller
WHERE jar_file_id = 2;
```

---

## 4. MOCK_RESPONSE 表（Mock 回應規則）

### 表格說明

儲存 Mock 回應規則與內容，使用複合主鍵確保規則唯一性。

### DDL（建表語句）

```sql
-- V4__Create_mock_response_table.sql
CREATE TABLE IF NOT EXISTS mock_response (
    publish_uri VARCHAR(255) NOT NULL,
    method VARCHAR(100) NOT NULL,
    condition VARCHAR(255) NOT NULL,
    service_type VARCHAR(10) NOT NULL,
    response_content TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT 1,
    create_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (publish_uri, method, condition, service_type)
);

-- 建立查詢索引（常用查詢組合）
CREATE INDEX IF NOT EXISTS idx_mock_response_uri_type
ON mock_response(publish_uri, service_type);

-- 建立查詢索引（依啟用狀態）
CREATE INDEX IF NOT EXISTS idx_mock_response_is_active
ON mock_response(is_active);
```

### 欄位說明

| 欄位名稱 | 型別 | 約束 | 預設值 | 說明 |
|---------|------|------|--------|------|
| `publish_uri` | VARCHAR(255) | NOT NULL, PRIMARY KEY | - | 發布路徑（如：`/ws/company` 或 `/api/company`） |
| `method` | VARCHAR(100) | NOT NULL, PRIMARY KEY | - | 方法名稱（ENDPOINT：`getCompanyInfo`；RESTFUL：`GET`、`POST`等） |
| `condition` | VARCHAR(255) | NOT NULL, PRIMARY KEY | - | 匹配條件（如：`companyId=001`、`default`） |
| `service_type` | VARCHAR(10) | NOT NULL, PRIMARY KEY | - | 服務類型：`ENDPOINT` 或 `RESTFUL` |
| `response_content` | TEXT | NOT NULL | - | 回應內容（XML 或 JSON 格式） |
| `is_active` | BOOLEAN | NOT NULL | 1 (true) | 是否啟用（0=停用, 1=啟用） |
| `create_time` | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP | 建立時間，自動填入 |

### 複合主鍵約束

```sql
PRIMARY KEY (publish_uri, method, condition, service_type)
```

確保每個 URI + Method + Condition + Service Type 組合都是唯一的。

### 服務類型定義

| 服務類型 | 說明 | Response Content 格式 |
|---------|------|---------------------|
| `ENDPOINT` | WSDL Web Service | XML（SOAP） |
| `RESTFUL` | RESTful API | JSON（通常） |

### 查詢範例

```sql
-- 精確匹配查詢（最常用）
SELECT response_content
FROM mock_response
WHERE publish_uri = '/ws/company'
  AND method = 'getCompanyInfo'
  AND condition = 'companyId=001'
  AND service_type = 'ENDPOINT'
  AND is_active = 1;

-- 預設回應查詢（當精確匹配不存在時）
SELECT response_content
FROM mock_response
WHERE publish_uri = '/ws/company'
  AND method = 'getCompanyInfo'
  AND condition = 'default'
  AND service_type = 'ENDPOINT'
  AND is_active = 1;

-- 查詢某個 URI 的所有 Mock Response
SELECT method, condition, service_type, is_active, create_time
FROM mock_response
WHERE publish_uri = '/ws/company'
  AND service_type = 'ENDPOINT'
ORDER BY create_time DESC;

-- 查詢所有已啟用的 Mock Response
SELECT * FROM mock_response
WHERE is_active = 1;
```

---

## 完整資料庫初始化腳本

### 建立所有表格（完整腳本）

```sql
-- ================================================
-- Dynamic API Manager - 資料庫初始化腳本
-- 版本：1.0.0
-- 日期：2026-01-02
-- 資料庫：SQLite 3.x
-- ================================================

-- 1. 建立 JAR_FILE 表
CREATE TABLE IF NOT EXISTS jar_file (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    file_name VARCHAR(255) NOT NULL UNIQUE,
    file_content BLOB NOT NULL,
    status VARCHAR(10) NOT NULL DEFAULT 'UNUSED',
    upload_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_jar_file_name ON jar_file(file_name);
CREATE INDEX IF NOT EXISTS idx_jar_file_status ON jar_file(status);

-- 2. 建立 ENDPOINT 表
CREATE TABLE IF NOT EXISTS endpoint (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    publish_uri VARCHAR(255) NOT NULL UNIQUE,
    bean_name VARCHAR(255) NOT NULL UNIQUE,
    class_path VARCHAR(255) NOT NULL,
    jar_file_id INTEGER NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT 0,
    create_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (jar_file_id) REFERENCES jar_file(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_endpoint_publish_uri ON endpoint(publish_uri);
CREATE UNIQUE INDEX IF NOT EXISTS idx_endpoint_bean_name ON endpoint(bean_name);
CREATE INDEX IF NOT EXISTS idx_endpoint_jar_file_id ON endpoint(jar_file_id);
CREATE INDEX IF NOT EXISTS idx_endpoint_is_active ON endpoint(is_active);

-- 3. 建立 CONTROLLER 表
CREATE TABLE IF NOT EXISTS controller (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    publish_uri VARCHAR(255) NOT NULL UNIQUE,
    class_path VARCHAR(255) NOT NULL,
    jar_file_id INTEGER NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT 0,
    create_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (jar_file_id) REFERENCES jar_file(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_controller_publish_uri ON controller(publish_uri);
CREATE INDEX IF NOT EXISTS idx_controller_jar_file_id ON controller(jar_file_id);
CREATE INDEX IF NOT EXISTS idx_controller_is_active ON controller(is_active);

-- 4. 建立 MOCK_RESPONSE 表
CREATE TABLE IF NOT EXISTS mock_response (
    publish_uri VARCHAR(255) NOT NULL,
    method VARCHAR(100) NOT NULL,
    condition VARCHAR(255) NOT NULL,
    service_type VARCHAR(10) NOT NULL,
    response_content TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT 1,
    create_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (publish_uri, method, condition, service_type)
);

CREATE INDEX IF NOT EXISTS idx_mock_response_uri_type ON mock_response(publish_uri, service_type);
CREATE INDEX IF NOT EXISTS idx_mock_response_is_active ON mock_response(is_active);

-- ================================================
-- 初始化完成
-- ================================================
```

---

## 資料庫遷移管理（Flyway）

### 遷移腳本命名規則

```
V{版本號}__{描述}.sql
```

範例：
- `V1__Create_jar_file_table.sql`
- `V2__Create_endpoint_table.sql`
- `V3__Create_controller_table.sql`
- `V4__Create_mock_response_table.sql`

### Flyway 遷移腳本位置

```
backend/src/main/resources/db/migration/
├── V1__Create_jar_file_table.sql
├── V2__Create_endpoint_table.sql
├── V3__Create_controller_table.sql
└── V4__Create_mock_response_table.sql
```

### Flyway 版本追蹤表

Flyway 自動建立 `flyway_schema_history` 表追蹤遷移版本：

```sql
SELECT * FROM flyway_schema_history;
```

---

## 資料庫備份與還原

### 備份

```bash
# SQLite 資料庫備份
cp database/dynamic-api.db database/dynamic-api.db.backup
```

### 還原

```bash
# SQLite 資料庫還原
cp database/dynamic-api.db.backup database/dynamic-api.db
```

---

## 相關文件

- [概念資料模型（ERD）](./erd) - 實體關係圖與說明
- [資料一致性策略](./consistency) - 交易管理與一致性保證
