---
sidebar_position: 4
---

# 名詞定義與縮寫

為避免溝通歧義，本文件使用的重要名詞與縮寫定義如下。

## 核心概念

### Endpoint
**定義**：本系統中指 WSDL Web Service 端點

**說明**：
- 使用 SOAP 協定
- 透過 Apache CXF 框架發布
- 可透過 WSDL 描述檔存取
- 範例：`http://localhost:8080/ws/company?wsdl`

**相關功能**：[Endpoint 管理](../functional-requirements/endpoint-management)

---

### Restful
**定義**：本系統中指 RESTful API Controller

**說明**：
- 使用 HTTP 協定（GET、POST、PUT、DELETE）
- 透過 Spring MVC 框架註冊
- 使用 JSON 或 XML 格式傳輸資料
- 範例：`http://localhost:8080/api/company/001`

**相關功能**：[Restful 管理](../functional-requirements/restful-management)

---

### JAR File
**定義**：Java Archive，包含編譯後的 Java 類別與資源的壓縮檔案

**說明**：
- 副檔名：`.jar`
- 包含：`.class` 檔案、設定檔、資源檔
- 本系統中用於封裝 Endpoint 或 Restful 的實作
- 儲存於資料庫的 BLOB 欄位

**相關功能**：[JAR 檔案管理](../functional-requirements/jar-management)

---

### Mock Response
**定義**：模擬回應，根據條件規則返回預先設定的回應內容

**說明**：
- 用於測試環境模擬真實 API 回應
- 支援多條件匹配（URI + Method + Condition）
- 支援 XML 與 JSON 格式
- 可快速啟用/停用

**相關功能**：[Mock 回應管理](../functional-requirements/mock-response)

---

### 動態載入
**定義**：在運行時（Runtime）從 JAR 檔案中載入類別，無需重啟應用程式

**說明**：
- 使用自訂的 `DynamicClassLoader`
- 支援熱部署（Hot Deployment）
- 每個 JAR 使用獨立的 ClassLoader，避免類別衝突
- 載入後可立即使用新功能

**技術細節**：詳見 SDD 文件

---

### 發布 URI (Publish URI)
**定義**：API 或 Web Service 的存取路徑

**說明**：
- 格式：`/開頭的路徑`
- Endpoint 範例：`/ws/company`
- Restful 範例：`/api/company`
- 在系統中作為唯一識別碼

---

### Condition
**定義**：用於匹配 Mock 回應的條件規則

**說明**：
- 用於區分不同情境的回應
- 範例：`companyId=001`、`status=active`、`default`
- `default` 表示預設回應（當其他條件不匹配時使用）
- 可包含請求參數、Header、Body 內容

**匹配邏輯**：
1. 先嘗試精確匹配（URI + Method + Condition）
2. 若未找到，使用預設回應（Condition = `default`）

---

## 技術名詞

### WSDL
**全名**：Web Services Description Language

**定義**：Web Service 的描述語言

**說明**：
- 使用 XML 格式
- 描述 Web Service 的介面、方法、參數
- 客戶端可透過 WSDL 自動產生呼叫程式碼
- 範例：`http://localhost:8080/ws/company?wsdl`

---

### SOAP
**全名**：Simple Object Access Protocol

**定義**：基於 XML 的通訊協定

**說明**：
- 用於交換結構化資訊
- 傳輸協定通常為 HTTP
- 訊息格式為 XML
- 本系統透過 JAX-WS 實作

---

### CXF
**全名**：Apache CXF

**定義**：開源 Web Service 框架

**說明**：
- 支援 JAX-WS（SOAP）與 JAX-RS（REST）
- 本系統使用 CXF 發布 WSDL Web Service
- 官方網站：https://cxf.apache.org/

---

### ClassLoader
**定義**：Java 類別載入器，負責載入類別到 JVM

**說明**：
- Java 內建機制
- 本系統使用自訂的 `DynamicClassLoader`
- 支援從 JAR 動態載入類別
- 實現類別隔離（不同 JAR 的同名類別不衝突）

---

### JPA
**全名**：Java Persistence API

**定義**：Java 持久化 API

**說明**：
- ORM（Object-Relational Mapping）框架
- 本系統使用 Spring Data JPA
- 負責資料庫存取（JAR File、Endpoint、Controller 實體）

---

## 縮寫對照表

| 縮寫 | 全名 | 中文 |
|------|------|------|
| **SRS** | Software Requirements Specification | 軟體需求規格書 |
| **SDD** | Software Design Document | 軟體設計規格書 |
| **API** | Application Programming Interface | 應用程式介面 |
| **JAR** | Java Archive | Java 壓縮檔案 |
| **URI** | Uniform Resource Identifier | 統一資源識別碼 |
| **HTTP** | Hypertext Transfer Protocol | 超文本傳輸協定 |
| **HTTPS** | HTTP Secure | 安全超文本傳輸協定 |
| **XML** | eXtensible Markup Language | 可延伸標記語言 |
| **JSON** | JavaScript Object Notation | JavaScript 物件表示法 |
| **SOAP** | Simple Object Access Protocol | 簡單物件存取協定 |
| **REST** | REpresentational State Transfer | 表現層狀態轉換 |
| **WSDL** | Web Services Description Language | Web 服務描述語言 |
| **CXF** | Apache CXF | Apache Web 服務框架 |
| **JPA** | Java Persistence API | Java 持久化 API |
| **ORM** | Object-Relational Mapping | 物件關聯對映 |
| **CRUD** | Create, Read, Update, Delete | 新增、查詢、更新、刪除 |
| **UI** | User Interface | 使用者介面 |
| **UX** | User Experience | 使用者體驗 |
| **PM** | Project Manager | 專案經理 |
| **BA** | Business Analyst | 業務分析師 |
| **QA** | Quality Assurance | 品質保證 |
| **Ops** | Operations | 維運 |

---

## 狀態值定義

### JAR 檔案狀態

| 狀態值 | 說明 |
|-------|------|
| **UNUSED** | 未使用（尚未被任何 Endpoint/Restful 使用） |
| **INUSED** | 使用中（正被某個 Endpoint/Restful 使用） |

### Endpoint / Restful 狀態

| 狀態值 | 說明 |
|-------|------|
| **is_active = true** | 已啟用（服務正在運行） |
| **is_active = false** | 已停用（服務未運行） |

### Mock Response 狀態

| 狀態值 | 說明 |
|-------|------|
| **is_active = true** | 已啟用（回應規則生效） |
| **is_active = false** | 已停用（回應規則不生效） |

---

## 相關文件

- [系統範圍](./scope) - 了解系統邊界
- [系統架構](../overview/architecture) - 了解系統組成
- [功能需求](../functional-requirements/jar-management) - 詳細功能說明
