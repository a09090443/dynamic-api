# Dynamic API Manager - 軟體設計規格書（SDD）

---

## 0. 文件資訊

- **文件名稱**：Dynamic API Manager 軟體設計規格書
- **系統／專案名稱**：Dynamic API Manager
- **版本**：1.0.0
- **修訂日期**：2026-01-02
- **作者**：開發團隊
- **對應 SRS 版本**：1.0.0

---

## 1. 簡介

### 1.1 文件目的

本文件詳細描述 Dynamic API Manager 系統的技術設計，包括架構設計、模組設計、資料庫設計、API 設計、部署設計等。目標讀者為架構師、後端開發、前端開發、QA 測試與維運人員。

本文件與 SRS 版本 1.0.0 對應，旨在將需求轉化為可實作的技術設計。

### 1.2 文件範圍（本文件涵蓋的設計層級）

本文件涵蓋：
- **高階架構設計**：整體架構風格、部署拓撲、技術選型
- **模組設計**：各功能模組的職責、元件與互動關係
- **資料設計**：資料庫 Schema、ERD、一致性策略
- **介面設計**：API 規格、請求／回應格式、錯誤處理
- **業務流程設計**：核心流程的序列圖與演算法
- **安全性設計**：認證授權、資料保護、錯誤處理
- **部署設計**：部署流程、環境配置、監控機制

本文件不涵蓋：
- 詳細的程式碼實作（保留給開發階段）
- 測試案例設計（保留給測試計畫）

### 1.3 讀者（架構師、後端、前端、QA、Ops）

| 角色 | 關注章節 |
|------|---------|
| **系統架構師** | 第 2 章（總體設計）、第 9 章（設計決策） |
| **後端開發** | 第 3 章（模組設計）、第 4 章（資料設計）、第 5 章（API 設計）、第 6 章（業務流程） |
| **前端開發** | 第 5 章（API 設計）、第 3 章（前端模組） |
| **QA 測試** | 第 5 章（API 規格）、第 6 章（業務流程）、第 7 章（錯誤處理） |
| **維運人員** | 第 8 章（部署與運維） |

### 1.4 參考文件（SRS、API Spec、DB 文件等）

- Dynamic API Manager SRS v1.0.0
- Spring Boot 官方文件：https://spring.io/projects/spring-boot
- Apache CXF 官方文件：https://cxf.apache.org/
- Next.js 官方文件：https://nextjs.org/
- SQLite 官方文件：https://www.sqlite.org/
- JAX-WS 規格：https://javaee.github.io/metro-jax-ws/

---

## 2. 系統總體設計

### 2.1 架構概覽

#### 架構風格

Dynamic API Manager 採用 **前後端分離的分層架構**，結合 **插件式動態載入機制**。

**分層架構**（後端）：
```
┌─────────────────────────────────────────┐
│          Controller 層                  │  ← HTTP 請求處理
├─────────────────────────────────────────┤
│          Service 層                     │  ← 業務邏輯
├─────────────────────────────────────────┤
│          Repository 層                  │  ← 資料存取（JPA）
├─────────────────────────────────────────┤
│          JDBC 層                        │  ← 複雜查詢（JDBC）
├─────────────────────────────────────────┤
│          Utility 層                     │  ← 工具類別（ClassLoader、WSDL 轉換）
└─────────────────────────────────────────┘
```

**前端架構**（Next.js）：
```
┌─────────────────────────────────────────┐
│          Page Components                │  ← 頁面組件
├─────────────────────────────────────────┤
│          Feature Components             │  ← 功能組件（Table、Form）
├─────────────────────────────────────────┤
│          Service 層                     │  ← API 呼叫封裝
├─────────────────────────────────────────┤
│          Types                          │  ← TypeScript 型別定義
└─────────────────────────────────────────┘
```

#### 主要組成

| 組成部分 | 技術 | 職責 |
|---------|------|------|
| **前端介面** | Next.js 15 + React 19 + MUI | 提供管理介面（Endpoint、Restful、Response 管理） |
| **後端 API** | Spring Boot 3.2.5 + Spring MVC | 提供 RESTful API 給前端呼叫 |
| **動態載入引擎** | 自訂 DynamicClassLoader | 從 JAR 載入類別並發布服務 |
| **Web Service 發布** | Apache CXF 4.0 | 發布 WSDL Web Service |
| **RESTful 路由註冊** | Spring RequestMappingHandlerMapping | 動態註冊 RESTful Controller |
| **資料持久化** | Spring Data JPA + JDBC | 儲存 JAR、Endpoint、Controller、Mock Response |
| **資料庫** | SQLite 嵌入式資料庫 | 儲存所有配置與 JAR 二進制內容 |

#### 整體互動關係

```
┌──────────────┐
│   瀏覽器     │
└──────┬───────┘
       │ HTTP
       ▼
┌──────────────────────────────────────────────────────┐
│              Next.js 前端應用                         │
│   - Endpoint 管理頁面                                 │
│   - Restful 管理頁面                                  │
│   - Response 管理頁面                                 │
└──────┬───────────────────────────────────────────────┘
       │ HTTP API (/dynamic-api/*)
       ▼
┌──────────────────────────────────────────────────────┐
│              Spring Boot 後端應用                     │
│                                                       │
│   ┌────────────────────────────────────────┐         │
│   │  Controller 層                         │         │
│   │  - WebServiceController                │         │
│   │  - DynamicLoadController               │         │
│   │  - CommonController                    │         │
│   └────────┬───────────────────────────────┘         │
│            │                                          │
│   ┌────────▼───────────────────────────────┐         │
│   │  Service 層                            │         │
│   │  - DynamicWebServiceImpl               │         │
│   │  - DynamicControllerServiceImpl        │         │
│   │  - CommonServiceImpl                   │         │
│   └────────┬───────────────────────────────┘         │
│            │                                          │
│   ┌────────▼───────────────┬─────────────────┐       │
│   │  Utility 層            │  Repository 層  │       │
│   │  - DynamicClassLoader  │  - JPA Repos    │       │
│   │  - WebServiceHandler   │  - JDBC Queries │       │
│   │  - Wsdl2JavaUtil       │                 │       │
│   └────────────────────────┴─────────┬───────┘       │
│                                      │               │
└──────────────────────────────────────┼───────────────┘
                                       │
                                       ▼
                            ┌──────────────────┐
                            │  SQLite Database │
                            │  - jar_file      │
                            │  - endpoint      │
                            │  - controller    │
                            │  - mock_response │
                            └──────────────────┘

                    ┌───────────────────────┐
                    │  外部系統             │
                    │  - SOAP Client        │
                    │  - REST Client        │
                    └──────┬────────────────┘
                           │
                           ▼
            ┌──────────────────────────────┐
            │  動態載入的服務               │
            │  - Web Service (CXF)         │
            │  - RESTful API (Spring MVC)  │
            └──────────────────────────────┘
```

### 2.2 部署拓撲（單機、容器、K8s、雲端等）

#### 開發模式

```
┌─────────────────────────────────────────────────────────┐
│  開發機器                                                │
│                                                          │
│  ┌────────────────┐      ┌──────────────────┐          │
│  │  Next.js Dev   │      │  Spring Boot     │          │
│  │  localhost:3000│◄────►│  localhost:8080  │          │
│  │  (Hot Reload)  │ CORS │  (bootRun)       │          │
│  └────────────────┘      └─────────┬────────┘          │
│                                    │                     │
│  ┌────────────────┐      ┌─────────▼────────┐          │
│  │  Docusaurus    │      │  SQLite DB       │          │
│  │  localhost:3001│      │  (embedded)      │          │
│  │  (文檔網站)    │      └──────────────────┘          │
│  └────────────────┘                                     │
│  ↑ 可選，避免 Port 衝突建議使用 3001                   │
└─────────────────────────────────────────────────────────┘
```

#### 生產模式

```
┌─────────────────────────────────────────────────┐
│  部署伺服器                                      │
│                                                  │
│  ┌──────────────────────────────────────────┐  │
│  │  Spring Boot Embedded JAR                │  │
│  │  localhost:8080                          │  │
│  │                                          │  │
│  │  ┌────────────────────────────────┐     │  │
│  │  │  Next.js Static Files          │     │  │
│  │  │  (src/main/resources/static)   │     │  │
│  │  └────────────────────────────────┘     │  │
│  │                                          │  │
│  │  ┌────────────────────────────────┐     │  │
│  │  │  Spring Boot Application       │     │  │
│  │  │  (Controllers, Services, etc.) │     │  │
│  │  └─────────────┬──────────────────┘     │  │
│  └────────────────┼───────────────────────┘  │
│                   │                           │
│         ┌─────────▼────────┐                  │
│         │  SQLite DB       │                  │
│         │  (database/)     │                  │
│         └──────────────────┘                  │
└─────────────────────────────────────────────────┘
```

**部署單元**：
- **單一 JAR 檔案**：`backend-0.0.1-SNAPSHOT.jar`
- **內含**：Spring Boot 應用程式 + Next.js 建置產物 + SQLite 資料庫檔案

**Docusaurus 文檔部署**（可選）：

Docusaurus 文檔不包含在主應用程式 JAR 中，可獨立部署：

**選項 1：本地靜態伺服器**
```bash
cd website
npm run build
npm run serve
```
訪問：http://localhost:3000

**選項 2：部署至 GitHub Pages**
```bash
cd website
# 編輯 docusaurus.config.js 設定 GitHub 資訊
npm run deploy
```
訪問：https://[your-org].github.io/dynamic-api/

**選項 3：整合到 Nginx**
```bash
# 建置靜態檔案
cd website
npm run build

# 複製到 Nginx 靜態目錄
cp -r build/* /var/www/docs/
```

**選項 4：與主應用程式整合**（未來可選）
```bash
# 將 Docusaurus 建置產物整合到 Spring Boot
# 需修改 Gradle 建置腳本
```

**未來擴展（可選）**：
- **容器化部署**：使用 Docker 打包為容器映像
- **反向代理**：使用 Nginx 作為反向代理與靜態檔案伺服器
- **資料庫分離**：將 SQLite 替換為 PostgreSQL/MySQL（需評估）
- **文檔整合**：將 Docusaurus 建置產物整合到主應用程式 JAR

### 2.3 執行環境與關鍵技術（語言、框架、資料庫類型等）

#### 後端技術棧

| 技術 | 版本 | 用途 |
|------|------|------|
| **Java** | OpenJDK 17+ | 程式語言 |
| **Spring Boot** | 3.2.5 | 應用框架 |
| **Spring MVC** | (隨 Spring Boot) | RESTful API 框架 |
| **Spring Data JPA** | (隨 Spring Boot) | ORM 框架 |
| **Apache CXF** | 4.0+ | Web Service 框架 |
| **SQLite JDBC** | 3.45.x | 資料庫驅動 |
| **Flyway** | (隨 Spring Boot) | 資料庫遷移工具 |
| **Lombok** | (最新版本) | 程式碼簡化 |
| **Gradle** | 8.7+ | 建置工具 |

#### 前端技術棧

| 技術 | 版本 | 用途 |
|------|------|------|
| **Node.js** | 22+ | 執行環境 |
| **Next.js** | 15.5.4 | React 框架 |
| **React** | 19+ | UI 框架 |
| **TypeScript** | 5.x | 程式語言 |
| **Material-UI (MUI)** | 6.x | UI 元件庫 |
| **Axios** | (最新版本) | HTTP Client |

#### 資料庫

| 類型 | 產品 | 說明 |
|------|------|------|
| **嵌入式關聯式資料庫** | SQLite 3 | 儲存 JAR 檔案（BLOB）、配置資料 |

#### 開發工具

| 工具 | 用途 |
|------|------|
| **IntelliJ IDEA** | Java 開發 IDE |
| **VS Code** | 前端開發編輯器 |
| **Git** | 版本控制 |
| **Postman** | API 測試 |
| **SoapUI** | Web Service 測試 |

### 2.4 設計限制與前提（例如：必須沿用既有系統X、特定雲平台）

#### 設計限制

1. **單機部署優先**：初版不考慮分散式部署與叢集管理
2. **嵌入式資料庫**：使用 SQLite，不依賴外部資料庫伺服器
3. **同步處理**：JAR 載入為同步操作，不支援非同步載入（未來可擴展）
4. **Java 平台限定**：僅支援 Java 開發的 JAR 模組
5. **協定限制**：僅支援 SOAP（JAX-WS）與 RESTful（Spring MVC），不支援 GraphQL、gRPC

#### 前提假設

1. **JAR 模組符合規範**：上傳的 JAR 必須繼承 `WebserviceBase` 或 `RestfulBase`
2. **類別路徑正確**：使用者提供的 Class Path 必須在 JAR 中存在
3. **JVM 記憶體充足**：每個載入的 JAR 會佔用 JVM 記憶體，需確保記憶體充足
4. **網路環境穩定**：前後端通訊依賴穩定的網路連線

#### 技術債與風險

1. **ClassLoader 記憶體洩漏風險**：多次載入／卸載 JAR 可能導致記憶體洩漏（需監控）
2. **SQLite 並發限制**：SQLite 不支援高並發寫入（未來可能需替換為 PostgreSQL）
3. **安全性機制未完善**：初版缺乏認證授權機制（<!-- TODO: 待補充 -->）
4. **JAR 檔案病毒掃描缺失**：無病毒掃描機制（<!-- TODO: 待評估整合 ClamAV -->）

---

## 3. 模組與元件設計

### 3.1 JAR 檔案管理模組

#### 職責與邊界

- **職責**：
  - 接收使用者上傳的 JAR 檔案
  - 將 JAR 內容以 BLOB 格式儲存到資料庫
  - 提供 JAR 檔案清單查詢
  - 管理 JAR 檔案狀態（UNUSED / INUSED）
  - 刪除未使用的 JAR 檔案
- **邊界**：
  - 不負責 JAR 內容的驗證（由動態載入模組負責）
  - 不負責 JAR 的解析與類別載入

#### 主要類別／元件／服務清單

| 類別 | 類型 | 職責 |
|------|------|------|
| **CommonController** | Controller | 處理 JAR 上傳 API 請求 |
| **CommonServiceImpl** | Service | JAR 檔案管理業務邏輯 |
| **JarFile** | Entity | JAR 檔案實體（JPA） |
| **JarFileRepository** | Repository | JAR 檔案資料存取（JPA） |
| **JarFileJDBC** | JDBC | JAR 檔案複雜查詢（JDBC） |

#### 輸入／輸出

**輸入**：
- `POST /dynamic-api/common/uploadJarFile`
  - Request: `MultipartFile` (JAR 檔案)
- `GET /dynamic-api/common/getJarFileList`
  - Request: 無（或分頁參數）
- `DELETE /dynamic-api/common/deleteJarFile`
  - Request: `{ "id": 1 }`

**輸出**：
- JAR 檔案 ID、檔案名稱、狀態、上傳時間

#### 與其他模組的關係

- **被依賴**：Endpoint 管理模組、Restful 管理模組（查詢 JAR 清單、更新狀態）
- **依賴**：無

---

### 3.2 Endpoint 管理模組（WSDL Web Service）

#### 職責與邊界

- **職責**：
  - 新增、編輯、刪除、查詢 Endpoint 配置
  - 啟用 Endpoint：從 JAR 載入類別並使用 Apache CXF 發布 Web Service
  - 停用 Endpoint：停止發布 Web Service
  - 更新 JAR 檔案狀態（啟用時設為 INUSED，刪除時檢查並更新為 UNUSED）
- **邊界**：
  - 不負責 Mock 回應的管理（由 Mock 回應模組負責）
  - 不負責 WSDL 檔案的產生（由 Apache CXF 自動產生）

#### 主要類別／元件／服務清單

| 類別 | 類型 | 職責 |
|------|------|------|
| **WebServiceController** | Controller | 處理 Endpoint 管理 API 請求 |
| **DynamicWebServiceImpl** | Service | Endpoint 動態載入業務邏輯 |
| **Endpoint** | Entity | Endpoint 實體（JPA） |
| **EndpointRepository** | Repository | Endpoint 資料存取（JPA） |
| **EndpointJDBC** | JDBC | Endpoint 複雜查詢（JDBC） |
| **DynamicClassLoader** | Utility | 從 JAR 載入類別 |
| **WebServiceHandler** | Utility | 管理 Apache CXF Endpoint 生命週期 |
| **Wsdl2JavaUtil** | Utility | WSDL 轉 Java 工具 |

#### 核心流程：啟用 Endpoint

```
1. WebServiceController.switchWebService(endpointId)
2. DynamicWebServiceImpl.switchWebService(endpointId)
   a. 查詢 Endpoint 實體
   b. 檢查 is_active 狀態
   c. 若為停用，執行啟用邏輯：
      i.  查詢關聯的 JAR 檔案
      ii. 從資料庫讀取 JAR BLOB 內容
      iii. 建立 DynamicClassLoader 實例
      iv. 從 JAR 載入指定的類別（Class.forName(classPath, true, classLoader)）
      v.  實例化類別（Class.newInstance()）
      vi. 使用 WebServiceHandler 發布 Web Service
          - Endpoint.publish(publishUri, serviceInstance)
      vii. 更新 Endpoint.is_active = true
      viii. 更新 JarFile.status = INUSED
   d. 若為啟用，執行停用邏輯：
      i.  使用 WebServiceHandler 停止 Web Service
          - Endpoint.stop()
      ii. 更新 Endpoint.is_active = false
      iii. 檢查 JAR 是否被其他 Endpoint/Restful 使用，若否則更新 JarFile.status = UNUSED
3. 返回成功／失敗訊息
```

#### 與其他模組的關係

- **依賴**：JAR 檔案管理模組（查詢 JAR、更新狀態）
- **被依賴**：前端 Endpoint 管理頁面

---

### 3.3 Restful 管理模組（RESTful API Controller）

#### 職責與邊界

- **職責**：
  - 新增、編輯、刪除、查詢 Restful Controller 配置
  - 啟用 Controller：從 JAR 載入類別並使用 Spring RequestMappingHandlerMapping 註冊路由
  - 停用 Controller：卸載路由
  - 更新 JAR 檔案狀態
- **邊界**：
  - 不負責 Mock 回應的管理
  - 不負責 API 文件產生（未來可整合 Springdoc）

#### 主要類別／元件／服務清單

| 類別 | 類型 | 職責 |
|------|------|------|
| **DynamicLoadController** | Controller | 處理 Restful 管理 API 請求 |
| **DynamicControllerServiceImpl** | Service | Restful 動態載入業務邏輯 |
| **Controller** | Entity | Restful Controller 實體（JPA） |
| **ControllerRepository** | Repository | Controller 資料存取（JPA） |
| **ControllerJDBC** | JDBC | Controller 複雜查詢（JDBC） |
| **DynamicClassLoader** | Utility | 從 JAR 載入類別 |
| **RequestMappingHandlerMapping** | Spring Bean | Spring MVC 路由映射管理器 |

#### 核心流程：啟用 Restful Controller

```
1. DynamicLoadController.switchController(controllerId)
2. DynamicControllerServiceImpl.switchController(controllerId)
   a. 查詢 Controller 實體
   b. 檢查 is_active 狀態
   c. 若為停用，執行啟用邏輯：
      i.  查詢關聯的 JAR 檔案
      ii. 從資料庫讀取 JAR BLOB 內容
      iii. 建立 DynamicClassLoader 實例
      iv. 從 JAR 載入指定的類別（Class.forName(classPath, true, classLoader)）
      v.  實例化類別（Class.newInstance()）
      vi. 註冊到 RequestMappingHandlerMapping
          - handlerMapping.registerMapping(requestMappingInfo, controllerInstance, method)
      vii. 更新 Controller.is_active = true
      viii. 更新 JarFile.status = INUSED
   d. 若為啟用，執行停用邏輯：
      i.  從 RequestMappingHandlerMapping 卸載路由
          - handlerMapping.unregisterMapping(requestMappingInfo)
      ii. 更新 Controller.is_active = false
      iii. 檢查 JAR 是否被其他 Endpoint/Restful 使用，若否則更新 JarFile.status = UNUSED
3. 返回成功／失敗訊息
```

#### 與其他模組的關係

- **依賴**：JAR 檔案管理模組（查詢 JAR、更新狀態）
- **被依賴**：前端 Restful 管理頁面

---

### 3.4 Mock 回應管理模組

#### 職責與邊界

- **職責**：
  - 新增、編輯、刪除、查詢 Mock Response 規則
  - 啟用／停用 Mock Response 規則
  - 提供回應查詢介面給 base-jar 使用
- **邊界**：
  - 不負責 Mock 回應的匹配邏輯（由 base-jar 的 `WebserviceBase` / `RestfulBase` 負責）
  - 不負責回應內容的格式轉換（由動態載入的服務負責）

#### 主要類別／元件／服務清單

| 類別 | 類型 | 職責 |
|------|------|------|
| **CommonController** | Controller | 處理 Mock Response 管理 API 請求 |
| **CommonServiceImpl** | Service | Mock Response 管理業務邏輯 |
| **MockResponse** | Entity | Mock Response 實體（JPA，複合主鍵） |
| **MockResponseRepository** | Repository | Mock Response 資料存取（JPA） |
| **MockResponseJDBC** | JDBC | Mock Response 複雜查詢（JDBC） |

**base-jar 模組類別**（供自訂 JAR 使用）：

| 類別 | 類型 | 職責 |
|------|------|------|
| **WebserviceBase** | Base Class | Endpoint JAR 繼承，提供 `findByPrimaryKey()` 查詢 Mock 回應 |
| **RestfulBase** | Base Class | Restful JAR 繼承，提供 `findByPrimaryKey()` 查詢 Mock 回應 |
| **MockResponseDao** | DAO | Mock Response 資料存取介面 |
| **MockResponseJDBC** | JDBC | Mock Response JDBC 查詢實作 |

#### Mock 回應匹配流程

```
1. 外部系統呼叫動態載入的 Web Service 或 RESTful API
2. 自訂 JAR 的方法中呼叫 findByPrimaryKey(publishUri, method, condition, clazz)
   - publishUri: 當前服務的 Publish URI
   - method: 當前方法名稱（如："getCompanyInfo"、"POST"）
   - condition: 匹配條件（如："companyId=001"、"default"）
   - clazz: 回應類別（用於反序列化）
3. MockResponseJDBC.findByPrimaryKey() 查詢資料庫
   - 查詢條件：publish_uri = ? AND method = ? AND condition = ? AND service_type = ? AND is_active = true
4. 若找到記錄，將 response_content（XML 或 JSON）反序列化為指定的類別
5. 返回反序列化後的物件
6. 若未找到，嘗試查詢 condition = 'default' 的記錄
7. 若仍未找到，返回 null（或拋出異常，由自訂 JAR 決定）
```

#### 與其他模組的關係

- **被依賴**：base-jar 模組（透過 JDBC 查詢）
- **依賴**：無

---

### 3.5 前端管理介面模組

#### 職責與邊界

- **職責**：
  - 提供 Endpoint 管理介面（新增、編輯、刪除、啟用/停用）
  - 提供 Restful 管理介面（新增、編輯、刪除、啟用/停用）
  - 提供 Response 管理介面（新增、編輯、刪除、啟用/停用）
  - 提供 JAR 檔案上傳介面
  - 提供 WSDL 轉 Java 工具介面
- **邊界**：
  - 不負責業務邏輯（由後端 API 處理）
  - 不負責資料驗證（前端僅做基本格式檢查，後端負責完整驗證）

#### 主要元件清單

**頁面組件**（Page Components）：

| 組件 | 路徑 | 職責 |
|------|------|------|
| **EndpointPage** | `/endpoint` | Endpoint 管理主頁面 |
| **RestfulPage** | `/restful` | Restful 管理主頁面 |
| **ResponsePage** | `/response` | Response 管理主頁面 |

**功能組件**（Feature Components）：

| 組件 | 職責 |
|------|------|
| **EndpointTable** | 顯示 Endpoint 清單，提供編輯／刪除／啟用/停用操作 |
| **EndpointForm** | 新增／編輯 Endpoint 表單 |
| **RestfulTable** | 顯示 Restful 清單，提供編輯／刪除／啟用/停用操作 |
| **RestfulForm** | 新增／編輯 Restful 表單 |
| **ResponseTable** | 顯示 Response 清單，提供編輯／刪除／啟用/停用操作 |
| **ResponseForm** | 新增／編輯 Response 表單（包含 XML/JSON 編輯器） |
| **JarFileUpload** | JAR 檔案上傳元件 |
| **WsdlToolDialog** | WSDL 轉 Java 工具對話框 |

**服務層**（Service Layer）：

| 服務 | 職責 |
|------|------|
| **endpointService** | 封裝 Endpoint 相關 API 呼叫 |
| **restfulService** | 封裝 Restful 相關 API 呼叫 |
| **responseService** | 封裝 Response 相關 API 呼叫 |
| **jarFileService** | 封裝 JAR 檔案相關 API 呼叫 |

#### 技術細節

- **狀態管理**：使用 React Hooks（`useState`、`useEffect`）
- **表單處理**：使用 MUI 表單元件（`TextField`、`Select`、`Button`）
- **表格顯示**：使用 MUI `Table` 或 `DataGrid`
- **檔案上傳**：使用 HTML5 `input[type="file"]` + `FormData`
- **程式碼編輯器**：使用 `react-monaco-editor` 或 `react-codemirror`（用於編輯 XML/JSON）

#### 與其他模組的關係

- **依賴**：後端 API 模組（所有 API 呼叫）
- **被依賴**：無（使用者直接互動）

---

## 4. 資料設計

### 4.1 概念資料模型（實體與關係，可用 Mermaid ERD）

**實體與關係圖**（ERD）：

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

**關係說明**：
- **JAR_FILE ─ ENDPOINT**：一對多（一個 JAR 可被多個 Endpoint 使用）
- **JAR_FILE ─ CONTROLLER**：一對多（一個 JAR 可被多個 Controller 使用）
- **MOCK_RESPONSE**：獨立實體，透過 `publish_uri` 與 `service_type` 與 Endpoint/Controller 邏輯關聯（無外鍵）

### 4.2 資料儲存設計

#### 資料庫類型

- **SQLite**：嵌入式關聯式資料庫，檔案位於 `backend/database/dynamic-api.db`

#### 主要資料表

##### 表格：JAR_FILE

| 欄位名稱 | 型別 | 約束 | 說明 |
|---------|------|------|------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | 主鍵 |
| file_name | VARCHAR(255) | NOT NULL, UNIQUE | 檔案名稱 |
| file_content | BLOB | NOT NULL | JAR 二進制內容 |
| status | VARCHAR(10) | NOT NULL, DEFAULT 'UNUSED' | 狀態（UNUSED / INUSED） |
| upload_time | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | 上傳時間 |

**索引**：
- PRIMARY KEY: `id`
- UNIQUE INDEX: `file_name`

---

##### 表格：ENDPOINT

| 欄位名稱 | 型別 | 約束 | 說明 |
|---------|------|------|------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | 主鍵 |
| publish_uri | VARCHAR(255) | NOT NULL, UNIQUE | 發布路徑（如：`/ws/company`） |
| bean_name | VARCHAR(255) | NOT NULL, UNIQUE | Spring Bean 名稱 |
| class_path | VARCHAR(255) | NOT NULL | 完整類別路徑 |
| jar_file_id | INTEGER | NOT NULL, FOREIGN KEY | 關聯 JAR_FILE.id |
| is_active | BOOLEAN | NOT NULL, DEFAULT FALSE | 啟用狀態 |
| create_time | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | 建立時間 |

**索引**：
- PRIMARY KEY: `id`
- UNIQUE INDEX: `publish_uri`
- UNIQUE INDEX: `bean_name`
- FOREIGN KEY: `jar_file_id` REFERENCES `JAR_FILE(id)`

---

##### 表格：CONTROLLER

| 欄位名稱 | 型別 | 約束 | 說明 |
|---------|------|------|------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | 主鍵 |
| publish_uri | VARCHAR(255) | NOT NULL, UNIQUE | 發布路徑（如：`/api/company`） |
| class_path | VARCHAR(255) | NOT NULL | 完整類別路徑 |
| jar_file_id | INTEGER | NOT NULL, FOREIGN KEY | 關聯 JAR_FILE.id |
| is_active | BOOLEAN | NOT NULL, DEFAULT FALSE | 啟用狀態 |
| create_time | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | 建立時間 |

**索引**：
- PRIMARY KEY: `id`
- UNIQUE INDEX: `publish_uri`
- FOREIGN KEY: `jar_file_id` REFERENCES `JAR_FILE(id)`

---

##### 表格：MOCK_RESPONSE

| 欄位名稱 | 型別 | 約束 | 說明 |
|---------|------|------|------|
| publish_uri | VARCHAR(255) | NOT NULL, PRIMARY KEY | 發布路徑 |
| method | VARCHAR(100) | NOT NULL, PRIMARY KEY | 方法名稱或 HTTP Method |
| condition | VARCHAR(255) | NOT NULL, PRIMARY KEY | 條件（`default` 為預設） |
| service_type | VARCHAR(10) | NOT NULL, PRIMARY KEY | 服務類型（ENDPOINT / RESTFUL） |
| response_content | TEXT | NOT NULL | 回應內容（XML 或 JSON） |
| is_active | BOOLEAN | NOT NULL, DEFAULT TRUE | 啟用狀態 |
| create_time | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | 建立時間 |

**索引**：
- PRIMARY KEY: `(publish_uri, method, condition, service_type)`
- INDEX: `(publish_uri, service_type)` （用於查詢特定服務的所有回應）

---

#### Flyway 遷移腳本

**位置**：`backend/src/main/resources/db/migration/`

**主要腳本**：
- `V1__Create_jar_file_table.sql`：建立 JAR_FILE 表
- `V2__Create_endpoint_table.sql`：建立 ENDPOINT 表
- `V3__Create_controller_table.sql`：建立 CONTROLLER 表
- `V4__Create_mock_response_table.sql`：建立 MOCK_RESPONSE 表

### 4.3 資料一致性策略（交易、最終一致、事件溝通等）

#### 交易管理

**Spring @Transactional**：
- 所有寫入操作（新增、更新、刪除）使用 `@Transactional` 確保 ACID
- 交易隔離級別：`READ_COMMITTED`（SQLite 預設）

**關鍵交易場景**：

1. **啟用 Endpoint/Restful**：
   - 更新 Endpoint/Controller.is_active
   - 更新 JAR_FILE.status
   - 若任一操作失敗，全部回滾

2. **刪除 JAR 檔案**：
   - 檢查是否被 Endpoint/Controller 使用（`status = INUSED`）
   - 若是，拋出異常阻止刪除
   - 若否，刪除 JAR_FILE 記錄

3. **刪除 Endpoint/Restful**：
   - 刪除 Endpoint/Controller 記錄
   - 檢查 JAR 是否被其他 Endpoint/Controller 使用
   - 若否，更新 JAR_FILE.status = UNUSED

#### 並發控制

- **樂觀鎖定**：<!-- TODO: 目前未實作，未來可考慮使用 JPA @Version -->
- **悲觀鎖定**：SQLite 寫入時自動使用資料庫級鎖定

#### 資料一致性檢查

- **啟動時檢查**：應用程式啟動時掃描 ENDPOINT/CONTROLLER 表，同步 is_active 狀態與實際載入狀態
- **定期檢查**：<!-- TODO: 未來可考慮定期檢查 JAR_FILE.status 與實際使用情況 -->

---

## 5. 介面與 API 設計

### 5.1 對外 API 概述

#### 協定

- **RESTful HTTP**：所有管理 API 使用 RESTful 風格
- **Content-Type**：`application/json`
- **編碼**：UTF-8

#### 認證方式

<!-- TODO: 初版未實作認證，後續可考慮以下方案：
- HTTP Basic Authentication
- JWT Token
- API Key
-->

#### Base URL

- **開發模式**：`http://localhost:8080/dynamic-api`
- **生產模式**：`http://[host]:[port]/dynamic-api`

### 5.2 API 規格概要

#### 統一回應格式

**成功回應**：

```json
{
  "success": true,
  "data": { ... },
  "message": "操作成功"
}
```

**錯誤回應**：

```json
{
  "success": false,
  "error": {
    "code": "PUBLISH_URI_EXISTS",
    "message": "Publish URI 已存在"
  },
  "timestamp": "2026-01-02T10:30:00Z"
}
```

#### 統一錯誤碼

| 錯誤碼 | HTTP 狀態碼 | 說明 |
|--------|------------|------|
| INVALID_REQUEST | 400 | 請求參數無效 |
| PUBLISH_URI_EXISTS | 409 | Publish URI 已存在 |
| BEAN_NAME_EXISTS | 409 | Bean Name 已存在 |
| JAR_FILE_NOT_FOUND | 404 | JAR 檔案不存在 |
| CLASS_NOT_FOUND | 404 | 類別不存在於 JAR 中 |
| ENDPOINT_NOT_FOUND | 404 | Endpoint 不存在 |
| CONTROLLER_NOT_FOUND | 404 | Controller 不存在 |
| JAR_IN_USE | 409 | JAR 檔案使用中，無法刪除 |
| ENDPOINT_ACTIVE | 409 | Endpoint 啟用中，無法刪除 |
| LOAD_FAILED | 500 | 類別載入失敗 |
| PUBLISH_FAILED | 500 | 服務發布失敗 |

---

### 5.3 重要端點的 Request/Response Schema 與範例

#### Endpoint 管理 API

##### 1. 新增 Endpoint

**端點**：`POST /dynamic-api/ws/saveWebService`

**Request Body**：
```json
{
  "publishUri": "/ws/company",
  "beanName": "companyWebService",
  "classPath": "com.company.webservice.impl.CompanyWebServiceImpl",
  "jarFileId": 1
}
```

**Response**（成功）：
```json
{
  "success": true,
  "data": {
    "id": 1,
    "publishUri": "/ws/company",
    "beanName": "companyWebService",
    "classPath": "com.company.webservice.impl.CompanyWebServiceImpl",
    "jarFileId": 1,
    "isActive": false,
    "createTime": "2026-01-02T10:30:00Z"
  },
  "message": "Endpoint 新增成功"
}
```

**Response**（失敗）：
```json
{
  "success": false,
  "error": {
    "code": "PUBLISH_URI_EXISTS",
    "message": "Publish URI '/ws/company' 已存在"
  },
  "timestamp": "2026-01-02T10:30:00Z"
}
```

---

##### 2. 啟用 / 停用 Endpoint

**端點**：`GET /dynamic-api/ws/switchWebService?id={endpointId}`

**Request Parameters**：
- `id`：Endpoint ID

**Response**（啟用成功）：
```json
{
  "success": true,
  "data": {
    "id": 1,
    "isActive": true
  },
  "message": "Endpoint 啟用成功"
}
```

**Response**（載入失敗）：
```json
{
  "success": false,
  "error": {
    "code": "CLASS_NOT_FOUND",
    "message": "類別 'com.company.webservice.impl.CompanyWebServiceImpl' 不存在於 JAR 中"
  },
  "timestamp": "2026-01-02T10:30:00Z"
}
```

---

##### 3. 查詢 Endpoint 清單

**端點**：`GET /dynamic-api/ws/getEndpoints`

**Response**：
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "publishUri": "/ws/company",
      "beanName": "companyWebService",
      "classPath": "com.company.webservice.impl.CompanyWebServiceImpl",
      "jarFileName": "company-endpoint.jar",
      "isActive": true,
      "createTime": "2026-01-02T10:30:00Z"
    },
    {
      "id": 2,
      "publishUri": "/ws/employee",
      "beanName": "employeeWebService",
      "classPath": "com.company.webservice.impl.EmployeeWebServiceImpl",
      "jarFileName": "employee-endpoint.jar",
      "isActive": false,
      "createTime": "2026-01-02T11:00:00Z"
    }
  ],
  "message": "查詢成功"
}
```

---

##### 4. 刪除 Endpoint

**端點**：`DELETE /dynamic-api/ws/removeWebService`

**Request Body**：
```json
{
  "id": 1
}
```

**Response**（成功）：
```json
{
  "success": true,
  "message": "Endpoint 刪除成功"
}
```

**Response**（失敗）：
```json
{
  "success": false,
  "error": {
    "code": "ENDPOINT_ACTIVE",
    "message": "Endpoint 啟用中，請先停用後再刪除"
  },
  "timestamp": "2026-01-02T10:30:00Z"
}
```

---

#### Restful 管理 API

（結構與 Endpoint 類似，端點前綴為 `/dynamic-api/api/`）

##### 1. 新增 Restful

**端點**：`POST /dynamic-api/api/saveController`

**Request Body**：
```json
{
  "publishUri": "/api/company",
  "classPath": "com.company.controller.CompanyController",
  "jarFileId": 2
}
```

---

##### 2. 啟用 / 停用 Restful

**端點**：`GET /dynamic-api/api/switchController?id={controllerId}`

---

##### 3. 查詢 Restful 清單

**端點**：`GET /dynamic-api/api/getControllers`

---

#### Mock 回應管理 API

##### 1. 新增 Mock 回應

**端點**：`POST /dynamic-api/common/saveMockResponse`

**Request Body**：
```json
{
  "publishUri": "/ws/company",
  "method": "getCompanyInfo",
  "condition": "companyId=001",
  "serviceType": "ENDPOINT",
  "responseContent": "<company><id>001</id><name>ABC Company</name></company>"
}
```

**Response**：
```json
{
  "success": true,
  "message": "Mock 回應新增成功"
}
```

---

##### 2. 查詢 Mock 回應清單

**端點**：`POST /dynamic-api/common/getResponseList`

**Request Body**：
```json
{
  "publishUri": "/ws/company",
  "serviceType": "ENDPOINT"
}
```

**Response**：
```json
{
  "success": true,
  "data": [
    {
      "publishUri": "/ws/company",
      "method": "getCompanyInfo",
      "condition": "companyId=001",
      "serviceType": "ENDPOINT",
      "isActive": true,
      "createTime": "2026-01-02T10:30:00Z"
    },
    {
      "publishUri": "/ws/company",
      "method": "getCompanyInfo",
      "condition": "default",
      "serviceType": "ENDPOINT",
      "isActive": true,
      "createTime": "2026-01-02T10:00:00Z"
    }
  ],
  "message": "查詢成功"
}
```

---

#### JAR 檔案管理 API

##### 1. 上傳 JAR 檔案

**端點**：`POST /dynamic-api/common/uploadJarFile`

**Request**：`multipart/form-data`
- `file`：JAR 檔案

**Response**：
```json
{
  "success": true,
  "data": {
    "id": 1,
    "fileName": "company-endpoint.jar",
    "status": "UNUSED",
    "uploadTime": "2026-01-02T10:30:00Z"
  },
  "message": "JAR 檔案上傳成功"
}
```

---

### 5.4 內部介面設計

#### Service 介面

**DynamicWebService**：
```java
public interface DynamicWebService {
    void switchWebService(Long endpointId) throws Exception;
    List<EndpointDTO> getEndpoints();
    void saveWebService(EndpointDTO dto) throws Exception;
    void updateWebService(EndpointDTO dto) throws Exception;
    void removeWebService(Long endpointId) throws Exception;
}
```

**DynamicControllerService**：
```java
public interface DynamicControllerService {
    void switchController(Long controllerId) throws Exception;
    List<ControllerDTO> getControllers();
    void saveController(ControllerDTO dto) throws Exception;
    void updateController(ControllerDTO dto) throws Exception;
    void removeController(Long controllerId) throws Exception;
}
```

**CommonService**：
```java
public interface CommonService {
    Long uploadJarFile(MultipartFile file) throws Exception;
    List<JarFileDTO> getJarFileList();
    void deleteJarFile(Long id) throws Exception;
    List<MockResponseDTO> getResponseList(String publishUri, String serviceType);
    void saveMockResponse(MockResponseDTO dto) throws Exception;
    void updateResponse(MockResponseDTO dto) throws Exception;
    void deleteResponse(MockResponseDTO dto) throws Exception;
    void switchResponse(MockResponseDTO dto) throws Exception;
}
```

---

## 6. 業務流程與演算法設計

### 6.1 重要業務流程

#### 流程 1：Endpoint 動態載入與發布

**序列圖**：

```
使用者 → 前端 → WebServiceController → DynamicWebServiceImpl → EndpointRepository → SQLite
                                      ↓
                               JarFileRepository → SQLite
                                      ↓
                               DynamicClassLoader (載入 JAR)
                                      ↓
                               Class.forName(classPath)
                                      ↓
                               WebServiceHandler (發布)
                                      ↓
                               Apache CXF Endpoint.publish()
                                      ↓
                               更新 is_active = true
                                      ↓
                               返回成功
```

**步驟說明**：

1. 使用者在前端點擊「啟用」按鈕
2. 前端呼叫 `GET /dynamic-api/ws/switchWebService?id=1`
3. `WebServiceController` 接收請求，呼叫 `DynamicWebServiceImpl.switchWebService(1)`
4. `DynamicWebServiceImpl` 查詢 Endpoint 實體（id=1）
5. 檢查 `is_active` 狀態，若為 `false` 則執行啟用邏輯
6. 查詢關聯的 JAR 檔案（透過 `jar_file_id`）
7. 從資料庫讀取 `jar_file.file_content`（BLOB）
8. 建立 `DynamicClassLoader` 實例，傳入 JAR 二進制內容
9. 使用 `Class.forName(classPath, true, classLoader)` 載入類別
10. 使用 `clazz.getDeclaredConstructor().newInstance()` 實例化
11. 呼叫 `WebServiceHandler.publish(publishUri, serviceInstance)`
12. `WebServiceHandler` 內部呼叫 `Endpoint.publish(publishUri, serviceInstance)`（Apache CXF）
13. 更新 `endpoint.is_active = true`
14. 更新 `jar_file.status = INUSED`
15. 返回成功訊息給前端
16. 前端更新狀態顯示為「已啟用」

---

#### 流程 2：Mock 回應匹配與返回

**序列圖**：

```
外部系統 → 動態載入的 Web Service → WebserviceBase.findByPrimaryKey()
                                     ↓
                              MockResponseJDBC.findByPrimaryKey()
                                     ↓
                              SQLite 查詢 (publish_uri, method, condition, service_type)
                                     ↓
                              返回 response_content (XML)
                                     ↓
                              反序列化為指定的類別
                                     ↓
                              返回物件給 Web Service
                                     ↓
                              返回 SOAP 回應給外部系統
```

**步驟說明**：

1. 外部系統呼叫 Web Service：`POST http://localhost:8080/ws/company`（SOAP 請求）
2. Apache CXF 路由到動態載入的 `CompanyWebServiceImpl.getCompanyInfo(companyId)`
3. `CompanyWebServiceImpl` 呼叫繼承自 `WebserviceBase` 的方法：
   ```java
   String condition = "companyId=" + companyId;
   CompanyDTO company = findByPrimaryKey("/ws/company", "getCompanyInfo", condition, CompanyDTO.class);
   ```
4. `WebserviceBase.findByPrimaryKey()` 呼叫 `MockResponseDao.findByPrimaryKey()`
5. `MockResponseJDBC` 執行 SQL 查詢：
   ```sql
   SELECT response_content FROM mock_response
   WHERE publish_uri = '/ws/company'
     AND method = 'getCompanyInfo'
     AND condition = 'companyId=001'
     AND service_type = 'ENDPOINT'
     AND is_active = true
   ```
6. 若查詢到記錄，取得 `response_content`（XML 字串）
7. 使用 JAXB 或 Jackson XML 反序列化為 `CompanyDTO` 物件
8. 返回 `CompanyDTO` 給 `getCompanyInfo()` 方法
9. `getCompanyInfo()` 返回 `CompanyDTO` 給 Apache CXF
10. Apache CXF 將物件序列化為 SOAP 回應並返回給外部系統

---

### 6.2 核心演算法

#### 演算法 1：ClassLoader 隔離機制

**目的**：確保不同 JAR 的類別不會衝突，支援同名類別的多版本載入。

**實作**：

```java
public class DynamicClassLoader extends URLClassLoader {
    public DynamicClassLoader(URL[] urls, ClassLoader parent) {
        super(urls, parent);
    }

    @Override
    protected Class<?> loadClass(String name, boolean resolve) throws ClassNotFoundException {
        // 優先從當前 ClassLoader 載入（打破雙親委派模型）
        synchronized (getClassLoadingLock(name)) {
            Class<?> c = findLoadedClass(name);
            if (c == null) {
                try {
                    // 先嘗試從當前 JAR 載入
                    c = findClass(name);
                } catch (ClassNotFoundException e) {
                    // 若載入失敗，委派給父 ClassLoader
                    c = super.loadClass(name, resolve);
                }
            }
            if (resolve) {
                resolveClass(c);
            }
            return c;
        }
    }
}
```

**使用**：

```java
// 從資料庫讀取 JAR BLOB
byte[] jarBytes = jarFileRepository.findById(jarFileId).getFileContent();

// 建立臨時檔案
Path tempJar = Files.createTempFile("dynamic-jar-", ".jar");
Files.write(tempJar, jarBytes);

// 建立 DynamicClassLoader
URL[] urls = { tempJar.toUri().toURL() };
DynamicClassLoader classLoader = new DynamicClassLoader(urls, ClassLoader.getSystemClassLoader());

// 載入類別
Class<?> clazz = Class.forName(classPath, true, classLoader);
Object instance = clazz.getDeclaredConstructor().newInstance();

// 清理臨時檔案
Files.delete(tempJar);
```

**邊界情況處理**：
- JAR 檔案損毀：捕捉 `ZipException`，返回錯誤訊息
- 類別不存在：捕捉 `ClassNotFoundException`，返回錯誤訊息
- 記憶體洩漏：<!-- TODO: 需定期監控 ClassLoader 數量與記憶體使用 -->

---

#### 演算法 2：Mock 回應條件匹配

**偽碼**：

```
function findByPrimaryKey(publishUri, method, condition, serviceType, clazz):
    // 1. 嘗試精確匹配
    sql = "SELECT response_content FROM mock_response
           WHERE publish_uri = ? AND method = ? AND condition = ?
           AND service_type = ? AND is_active = true"
    result = executeQuery(sql, [publishUri, method, condition, serviceType])

    if result.isNotEmpty():
        return deserialize(result.responseContent, clazz)

    // 2. 若未找到，嘗試預設條件
    sql = "SELECT response_content FROM mock_response
           WHERE publish_uri = ? AND method = ? AND condition = 'default'
           AND service_type = ? AND is_active = true"
    result = executeQuery(sql, [publishUri, method, serviceType])

    if result.isNotEmpty():
        return deserialize(result.responseContent, clazz)

    // 3. 仍未找到，返回 null 或拋出異常
    return null  // 或 throw new ResponseNotFoundException()
```

---

## 7. 安全性與錯誤處理設計

### 7.1 認證與授權模型（角色與權限）

<!-- TODO: 初版未實作認證授權，後續版本可考慮以下設計 -->

**候選方案**：

#### 方案 1：HTTP Basic Authentication
- 簡單易實作
- 適用於內部系統
- 需搭配 HTTPS 防止密碼洩漏

#### 方案 2：JWT Token
- 無狀態，適合前後端分離
- 可設定過期時間
- 需實作 Token 刷新機制

#### 方案 3：API Key
- 適用於系統間整合
- 可設定不同權限等級
- 需實作 Key 管理介面

**角色設計（未來）**：

| 角色 | 權限 |
|------|------|
| **Admin** | 所有操作（上傳、新增、編輯、刪除、啟用/停用） |
| **Developer** | 上傳 JAR、新增/編輯 Endpoint/Restful、管理 Mock 回應 |
| **Tester** | 管理 Mock 回應（新增、編輯、啟用/停用） |
| **Viewer** | 僅查詢（無新增/編輯/刪除權限） |

### 7.2 資料保護（加密、遮罩、隱私處理）

#### 傳輸加密

- **HTTPS**：<!-- TODO: 生產環境建議啟用 HTTPS -->
- **憑證管理**：使用 Let's Encrypt 或內部 CA 簽發憑證

#### 資料儲存加密

- **JAR 檔案加密**：<!-- TODO: 目前 JAR BLOB 未加密，可考慮使用 AES 加密 -->
- **敏感欄位遮罩**：<!-- TODO: 目前無敏感欄位，未來若新增需評估 -->

#### 日誌保護

- **敏感資訊過濾**：避免在日誌中記錄密碼、Token 等敏感資訊
- **例外訊息過濾**：避免在錯誤訊息中洩漏系統內部資訊（如：資料庫路徑、類別名稱）

### 7.3 例外與錯誤處理策略（重試、降級、統一錯誤格式）

#### 全域例外處理

使用 Spring `@ControllerAdvice` 統一處理例外：

```java
@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(PublishUriExistsException.class)
    public ResponseEntity<ErrorResponse> handlePublishUriExists(PublishUriExistsException ex) {
        ErrorResponse error = ErrorResponse.builder()
            .code("PUBLISH_URI_EXISTS")
            .message(ex.getMessage())
            .timestamp(LocalDateTime.now())
            .build();
        return ResponseEntity.status(HttpStatus.CONFLICT).body(error);
    }

    @ExceptionHandler(ClassNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleClassNotFound(ClassNotFoundException ex) {
        ErrorResponse error = ErrorResponse.builder()
            .code("CLASS_NOT_FOUND")
            .message("類別載入失敗：" + ex.getMessage())
            .timestamp(LocalDateTime.now())
            .build();
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGenericException(Exception ex) {
        // 記錄完整 Stack Trace 到日誌
        log.error("未預期的錯誤", ex);

        // 返回通用錯誤訊息（避免洩漏內部資訊）
        ErrorResponse error = ErrorResponse.builder()
            .code("INTERNAL_ERROR")
            .message("系統內部錯誤，請聯絡管理員")
            .timestamp(LocalDateTime.now())
            .build();
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }
}
```

#### 重試機制

- **JAR 載入失敗**：不重試，直接返回錯誤（因為重試不會改變結果）
- **資料庫連線失敗**：使用 Spring Retry，最多重試 3 次（<!-- TODO: 待評估 -->）

#### 降級策略

- **Mock 回應查詢失敗**：返回預設回應（`condition = 'default'`）
- **動態服務無回應**：<!-- TODO: 待定義降級行為，如返回預設錯誤訊息 -->

---

## 8. 部署、設定與運維

### 8.1 部署流程概述（含 CI/CD 概要）

#### 開發模式部署

**後端**：
```bash
cd backend
./gradlew bootRun
```
- 啟動 Spring Boot 應用程式
- 預設埠號：8080
- 自動執行 Flyway 資料庫遷移

**前端**：
```bash
cd nextjs-dynamic-api-manager
npm install
npm run dev
```
- 啟動 Next.js 開發伺服器
- 預設埠號：3000
- 熱更新支援

**文檔服務**（可選）：
```bash
cd website
npm install
npm start
```
- 啟動 Docusaurus 開發伺服器
- 預設埠號：3000
- **重要**：與 Next.js 開發模式衝突，建議修改為 port 3001：
  ```bash
  npm start -- --port 3001
  ```

**Port 配置總覽**：

| 服務 | 預設 Port | 建議 Port（避免衝突） | 訪問地址 |
|------|----------|---------------------|---------|
| 後端 | 8080 | 8080 | http://localhost:8080/dynamic-api |
| 前端（開發） | 3000 | 3000 | http://localhost:3000/endpoint |
| 文檔 | 3000 | **3001** | http://localhost:3001 |

#### 生產模式部署

**建置**：
```bash
cd backend
./gradlew bootJar
```
- 自動執行 `buildFrontend` 任務（`npm run build`）
- 複製 Next.js 建置產物到 `src/main/resources/static/`
- 產生單一 JAR 檔案：`backend/build/libs/backend-0.0.1-SNAPSHOT.jar`

**執行**：
```bash
java -jar backend/build/libs/backend-0.0.1-SNAPSHOT.jar
```
- 啟動 Spring Boot 嵌入式 Tomcat
- 提供前端靜態檔案（透過 `SpaController`）
- 訪問：`http://localhost:8080/dynamic-api/`

#### CI/CD 流程（未來）

<!-- TODO: 待整合 GitHub Actions 或 GitLab CI -->

**建議流程**：
```
1. 開發人員推送程式碼到 Git
2. CI 伺服器拉取程式碼
3. 執行測試（./gradlew test）
4. 建置前端（npm run build）
5. 建置後端（./gradlew bootJar）
6. 打包為 Docker 映像（可選）
7. 部署到測試環境
8. 執行整合測試
9. 部署到生產環境（需人工審核）
```

### 8.2 組態管理（環境變數、設定檔、機密管理）

#### Spring Boot 設定檔

**位置**：`backend/src/main/resources/application.yml`

**主要配置**：

```yaml
server:
  port: 8080
  servlet:
    context-path: /dynamic-api

spring:
  datasource:
    url: jdbc:sqlite:database/dynamic-api.db
    driver-class-name: org.sqlite.JDBC
  jpa:
    database-platform: org.hibernate.community.dialect.SQLiteDialect
    hibernate:
      ddl-auto: none  # 使用 Flyway 管理 Schema
  flyway:
    enabled: true
    locations: classpath:db/migration

cxf:
  path: /ws
```

#### 環境變數（可覆蓋配置）

| 環境變數 | 說明 | 預設值 |
|---------|------|--------|
| `SERVER_PORT` | 伺服器埠號 | 8080 |
| `DB_PATH` | SQLite 資料庫路徑 | `database/dynamic-api.db` |
| `LOG_LEVEL` | 日誌級別 | INFO |

**使用範例**：
```bash
export SERVER_PORT=9090
export LOG_LEVEL=DEBUG
java -jar backend-0.0.1-SNAPSHOT.jar
```

#### Next.js 環境變數

**開發模式**（`.env.development`）：
```
NEXT_PUBLIC_API_URL=http://localhost:8080
```

**生產模式**（`.env.production`）：
```
NEXT_PUBLIC_API_URL=/dynamic-api
```

#### 機密管理

<!-- TODO: 目前無機密資訊需管理，未來若新增可考慮以下方案 -->

- **Spring Cloud Config**：集中管理配置
- **HashiCorp Vault**：儲存 API Key、資料庫密碼
- **Kubernetes Secrets**：容器化部署時使用

### 8.3 監控與紀錄（log、metrics、tracing、健康檢查端點）

#### 服務監控總覽

| 服務 | 監控方式 | 健康檢查 | 日誌位置 |
|------|---------|---------|---------|
| **後端** | Spring Boot Actuator | `/dynamic-api/actuator/health` | `backend/logs/` |
| **前端** | Next.js 內建 | 無（開發模式） | 瀏覽器 Console |
| **文檔** | Docusaurus 內建 | 無（靜態網站） | 瀏覽器 Console |

#### 日誌管理

**後端日誌**：

**日誌框架**：Logback（Spring Boot 預設）

**日誌級別**：
- **DEBUG**：詳細除錯資訊（開發模式）
- **INFO**：一般資訊（生產模式）
- **WARN**：警告訊息（如：Mock 回應未找到）
- **ERROR**：錯誤訊息（如：JAR 載入失敗）

**日誌格式**：
```
2026-01-02 10:30:00.123 [http-nio-8080-exec-1] INFO  c.d.c.WebServiceController - 啟用 Endpoint: id=1, publishUri=/ws/company
2026-01-02 10:30:01.456 [http-nio-8080-exec-1] ERROR c.d.s.DynamicWebServiceImpl - JAR 載入失敗: ClassNotFoundException: com.company.webservice.impl.CompanyWebServiceImpl
```

**日誌輪轉**：
```xml
<appender name="FILE" class="ch.qos.logback.core.rolling.RollingFileAppender">
    <file>logs/dynamic-api.log</file>
    <rollingPolicy class="ch.qos.logback.core.rolling.TimeBasedRollingPolicy">
        <fileNamePattern>logs/dynamic-api.%d{yyyy-MM-dd}.log</fileNamePattern>
        <maxHistory>30</maxHistory>
    </rollingPolicy>
</appender>
```

#### 健康檢查端點

使用 Spring Boot Actuator：

```yaml
management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics
  endpoint:
    health:
      show-details: always
```

**健康檢查 URL**：`GET /dynamic-api/actuator/health`

**回應範例**：
```json
{
  "status": "UP",
  "components": {
    "db": {
      "status": "UP",
      "details": {
        "database": "SQLite",
        "validationQuery": "SELECT 1"
      }
    },
    "diskSpace": {
      "status": "UP",
      "details": {
        "total": 500000000000,
        "free": 300000000000,
        "threshold": 10485760,
        "exists": true
      }
    }
  }
}
```

#### 監控指標（Metrics）

<!-- TODO: 未來可整合 Prometheus + Grafana -->

**建議指標**：
- **HTTP 請求數**：依端點、狀態碼統計
- **HTTP 回應時間**：P50、P90、P99
- **動態載入次數**：成功／失敗統計
- **ClassLoader 數量**：監控記憶體洩漏
- **資料庫查詢時間**：監控效能瓶頸

#### 分散式追蹤（Tracing）

<!-- TODO: 未來可整合 Spring Cloud Sleuth + Zipkin -->

---

## 9. 設計決策與權衡

### 9.1 重大設計決策與原因

#### 決策 1：使用 SQLite 而非外部資料庫

**原因**：
- **簡化部署**：無需額外安裝與配置資料庫伺服器
- **單一 JAR 部署**：所有資料內嵌於應用程式，方便移植
- **適合小型系統**：目前並發需求不高，SQLite 足夠應付

**權衡**：
- **並發限制**：SQLite 不支援高並發寫入
- **未來擴展**：若需支援叢集部署，需替換為 PostgreSQL/MySQL

---

#### 決策 2：將 JAR 檔案儲存為 BLOB 而非檔案系統

**原因**：
- **一致性保證**：JAR 與配置資料在同一資料庫，交易管理更簡單
- **避免路徑管理**：不需處理檔案路徑、權限、清理等問題
- **方便備份**：備份資料庫即可，無需額外備份檔案

**權衡**：
- **資料庫膨脹**：BLOB 會增加資料庫大小
- **查詢效能**：讀取 BLOB 比檔案系統慢（可透過快取優化）

---

#### 決策 3：前後端整合為單一 JAR 部署

**原因**：
- **簡化部署**：僅需執行一個 JAR 檔案
- **避免 CORS 問題**：生產模式下前後端同源
- **減少維運成本**：無需維護兩個獨立服務

**權衡**：
- **開發模式複雜度**：需同時啟動前後端開發伺服器
- **建置時間增加**：每次建置後端都需重新建置前端（可透過 Gradle 快取優化）

---

#### 決策 4：使用自訂 ClassLoader 而非 Spring Bean 動態註冊

**原因**：
- **類別隔離**：不同 JAR 的同名類別不會衝突
- **支援多版本**：可同時載入不同版本的相同類別
- **卸載支援**：停用服務後可釋放 ClassLoader（理論上，實際需驗證 GC）

**權衡**：
- **記憶體管理複雜**：需小心處理 ClassLoader 生命週期，避免記憶體洩漏
- **除錯困難**：ClassLoader 相關問題較難追查

---

### 9.2 考慮過但否決的方案

#### 方案 1：使用 OSGi 作為插件系統

**優點**：
- 成熟的模組化框架
- 完善的生命週期管理

**缺點**：
- 學習曲線陡峭
- 引入過多複雜度
- 與 Spring Boot 整合不佳

**否決原因**：系統規模不大，OSGi 過於重量級。

---

#### 方案 2：使用 Redis 快取 JAR 檔案

**優點**：
- 減少資料庫讀取壓力
- 提升載入效能

**缺點**：
- 引入額外依賴（Redis）
- 增加部署複雜度
- 快取一致性問題

**否決原因**：初版系統載入頻率不高，暫不需要快取。

---

#### 方案 3：將 Mock 回應儲存為獨立的 JSON/XML 檔案

**優點**：
- 易於手動編輯
- 可使用版本控制（Git）管理

**缺點**：
- 需處理檔案路徑管理
- 查詢效能較差（需掃描檔案）
- 與配置資料分離，一致性難保證

**否決原因**：資料庫查詢更快速，且易於管理。

---

### 9.3 已知風險與技術債

#### 風險 1：ClassLoader 記憶體洩漏

**描述**：多次載入／卸載 JAR 可能導致 ClassLoader 無法被 GC 回收。

**緩解措施**：
- 定期監控 JVM 記憶體使用
- 使用 JVisualVM 或 MAT 分析記憶體洩漏
- 限制同時載入的 JAR 數量

**技術債**：<!-- TODO: 需實作 ClassLoader 自動清理機制 -->

---

#### 風險 2：SQLite 並發寫入瓶頸

**描述**：SQLite 不支援高並發寫入，多個使用者同時操作可能導致鎖定。

**緩解措施**：
- 使用連線池（雖然 SQLite 效果有限）
- 限制同時操作的使用者數量
- 未來替換為 PostgreSQL

**技術債**：<!-- TODO: 若系統擴展需替換資料庫 -->

---

#### 風險 3：缺乏認證授權機制

**描述**：任何人都可以上傳 JAR、啟用服務，存在安全風險。

**緩解措施**：
- 初版部署於內部網路
- 使用防火牆限制存取

**技術債**：<!-- TODO: 下一版本需實作認證授權 -->

---

#### 風險 4：JAR 檔案病毒掃描缺失

**描述**：惡意 JAR 檔案可能包含病毒或後門。

**緩解措施**：
- 限制上傳者（僅內部開發人員）
- 人工審核 JAR 內容

**技術債**：<!-- TODO: 未來可整合 ClamAV 病毒掃描 -->

---

## 10. 附錄

### 10.1 版本歷史

| 版本 | 日期 | 作者 | 變更摘要 |
|------|------|------|---------|
| 1.0.0 | 2026-01-02 | 開發團隊 | 初版完成 |

---

### 10.2 額外圖表／範例

#### 類別關係圖（Controller → Service → Repository）

```
┌─────────────────────┐
│ WebServiceController│
└──────────┬──────────┘
           │ @Autowired
           ▼
┌─────────────────────┐
│ DynamicWebServiceImpl│
└──────────┬──────────┘
           │ @Autowired
           ▼
┌─────────────────────┐       ┌──────────────────┐
│ EndpointRepository  │       │ JarFileRepository│
└─────────────────────┘       └──────────────────┘
```

---

#### JAR 檔案結構範例（company-endpoint.jar）

```
company-endpoint.jar
├── META-INF/
│   └── MANIFEST.MF
├── com/
│   └── company/
│       ├── webservice/
│       │   ├── CompanyWebService.class (介面)
│       │   └── impl/
│       │       └── CompanyWebServiceImpl.class (實作，繼承 WebserviceBase)
│       └── dto/
│           ├── CompanyDTO.class
│           └── EmployeeDTO.class
└── lib/
    └── base.jar (base-jar 依賴)
```

---

#### Mock Response 範例（XML）

**Endpoint**：`/ws/company`
**Method**：`getCompanyInfo`
**Condition**：`companyId=001`

```xml
<company>
    <id>001</id>
    <name>ABC Company</name>
    <address>台北市信義區</address>
    <employees>
        <employee>
            <id>E001</id>
            <name>張三</name>
        </employee>
        <employee>
            <id>E002</id>
            <name>李四</name>
        </employee>
    </employees>
</company>
```

---

#### Mock Response 範例（JSON）

**Restful**：`/api/company`
**Method**：`GET`
**Condition**：`id=001`

```json
{
  "id": "001",
  "name": "ABC Company",
  "address": "台北市信義區",
  "employees": [
    {
      "id": "E001",
      "name": "張三"
    },
    {
      "id": "E002",
      "name": "李四"
    }
  ]
}
```

---

## SDD 寫作指引

- 儘量對應 SRS 的需求與模組，保持名稱一致
- 對重要設計決策給出理由與取捨，避免「黑箱」設計
- 若技術棧尚未決定，可保留為 `TODO:` 或以「例如」形式描述候選方案
- 設計文件應平衡細節與可讀性，過度細節可能導致維護困難
