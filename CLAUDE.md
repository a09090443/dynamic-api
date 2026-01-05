# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 專案概述

Dynamic API Manager 是一個動態 API 管理系統，允許在運行時動態加載 WSDL Web Service 和 RESTful API 的 JAR 檔案，並根據請求條件返回模擬回應內容。

**核心概念**：
- **動態加載**：在運行時從上傳的 JAR 檔案中加載 Web Service 和 RESTful Controller
- **Mock 回應**：根據 publishUri、method 和 condition 條件匹配並返回預設的回應內容
- **雙模式架構**：後端 Spring Boot + 前端 Next.js，支援開發和生產兩種模式

## 常用命令

### 後端 (Spring Boot)

**啟動後端服務**：
```bash
# Windows
cd backend
.\gradlew.bat bootRun

# macOS / Linux
cd backend
./gradlew bootRun
```

**建置 JAR 檔案**：
```bash
# Windows
cd backend
.\gradlew.bat bootJar

# macOS / Linux
cd backend
./gradlew bootJar
```
產物位於：`backend/build/libs/backend-0.0.1-SNAPSHOT.jar`

**清理建置**：
```bash
# Windows
cd backend
.\gradlew.bat clean

# macOS / Linux
cd backend
./gradlew clean
```

**執行測試**：
```bash
# Windows
cd backend
.\gradlew.bat test

# macOS / Linux
cd backend
./gradlew test
```

### 前端 (Next.js)

**開發模式**（熱更新支持）：
```bash
cd nextjs-dynamic-api-manager
npm install  # 首次需要
npm run dev
```
訪問：http://localhost:3000/endpoint

**建置前端**：
```bash
cd nextjs-dynamic-api-manager
npm run build
```

**型別檢查**：
```bash
cd nextjs-dynamic-api-manager
npm run type-check
```

**ESLint 檢查**：
```bash
cd nextjs-dynamic-api-manager
npm run lint
```

### 文檔服務 (Docusaurus)

**啟動文檔開發伺服器**：
```bash
cd website
npm install  # 首次需要
npm start
```
預設訪問：http://localhost:3000

**重要：Port 衝突解決方案**
由於 Next.js 開發模式也使用 port 3000，若需同時啟動前端與文檔，請使用以下任一方式：

**方案 1：修改 Docusaurus Port**（推薦）
```bash
cd website
npm start -- --port 3001
```
訪問：http://localhost:3001

**方案 2：修改 Next.js Port**
```bash
cd nextjs-dynamic-api-manager
npm run dev -- -p 3001
```
訪問：http://localhost:3001/endpoint

**建置文檔網站**：
```bash
cd website
npm run build
```
產物位於：`website/build/`

**預覽建置產物**：
```bash
cd website
npm run serve
```
訪問：http://localhost:3000

**清除文檔快取**：
```bash
cd website
npm run clear
```

### JAR 模組建置

**建置 base-jar**（提供基礎類別給自訂 JAR）：
```bash
# Windows
cd base-jar
.\gradlew.bat build

# macOS / Linux
cd base-jar
./gradlew build
```

**建置 endpoint JAR 範例**：
```bash
# Windows
cd endpoints/company-endpoint
.\gradlew.bat build

# macOS / Linux
cd endpoints/company-endpoint
./gradlew build
```

**建置 restful JAR 範例**：
```bash
# Windows
cd restfuls/company-restful
.\gradlew.bat build

# macOS / Linux
cd restfuls/company-restful
./gradlew build
```

## 啟動服務

### 服務概覽與 Port 配置

Dynamic API Manager 包含 3 個獨立服務，每個服務都有各自的 Port 配置：

| 服務 | Port | 用途 | 啟動模式 |
|------|------|------|---------|
| **後端服務** | 8080 | Spring Boot API + 動態載入引擎 | 必須啟動 |
| **前端服務** | 3000 (開發) / 8080 (生產) | Next.js 管理介面 | 開發模式可選 |
| **文檔服務** | 3000 (預設) / 3001 (建議) | Docusaurus 線上文件 | 可選 |

### Port 衝突問題

由於 **Next.js 開發模式** 與 **Docusaurus** 預設都使用 **port 3000**，若需同時啟動會發生衝突。請參考以下啟動策略。

---

### 啟動策略建議

#### 策略 1：僅開發應用（最常用）

**啟動順序**：
```bash
# 1. 啟動後端（必須）
cd backend
.\gradlew.bat bootRun

# 2. 啟動前端（開發模式）
cd nextjs-dynamic-api-manager
npm run dev
```

**訪問地址**：
- 前端管理介面：http://localhost:3000/endpoint
- 後端 API：http://localhost:8080/dynamic-api

**適用場景**：功能開發、測試、除錯

---

#### 策略 2：同時啟動應用與文檔

**啟動順序**：
```bash
# 1. 啟動後端（必須）
cd backend
.\gradlew.bat bootRun

# 2. 啟動前端（使用預設 port 3000）
cd nextjs-dynamic-api-manager
npm run dev

# 3. 啟動文檔（修改為 port 3001，避免衝突）
cd website
npm start -- --port 3001
```

**訪問地址**：
- 前端管理介面：http://localhost:3000/endpoint
- 線上文件：http://localhost:3001
- 後端 API：http://localhost:8080/dynamic-api

**適用場景**：需要同時查看文檔與開發功能

---

#### 策略 3：僅啟動文檔

**啟動順序**：
```bash
cd website
npm start
```

**訪問地址**：
- 線上文件：http://localhost:3000

**適用場景**：查閱系統文件、新成員了解系統

---

#### 策略 4：生產模式部署（單一服務）

**建置與啟動**：
```bash
# 建置（自動建置前端並整合）
cd backend
.\gradlew.bat bootJar

# 啟動（前後端整合在單一 JAR）
java -jar backend/build/libs/backend-0.0.1-SNAPSHOT.jar
```

**訪問地址**：
- 前端管理介面：http://localhost:8080/dynamic-api/endpoint
- 後端 API：http://localhost:8080/dynamic-api

**適用場景**：測試環境部署、生產環境部署

---

### 服務依賴關係

```
┌─────────────────┐
│  前端服務       │ ─────► 開發模式：必須依賴後端 API (port 8080)
│  (Next.js)      │        生產模式：嵌入到後端，無需獨立啟動
└─────────────────┘

┌─────────────────┐
│  後端服務       │ ─────► 核心服務，提供所有 API 與動態載入功能
│  (Spring Boot)  │        必須先啟動
└─────────────────┘

┌─────────────────┐
│  文檔服務       │ ─────► 獨立服務，不依賴其他服務
│  (Docusaurus)   │        可隨時啟動/停止
└─────────────────┘
```

---

### 常見問題與解決方案

#### Q1：啟動 Next.js 時出現「Port 3000 already in use」

**原因**：Docusaurus 已佔用 port 3000

**解決方案**：
1. 停止 Docusaurus 服務（Ctrl+C）
2. 或修改 Next.js port：`npm run dev -- -p 3001`

---

#### Q2：啟動 Docusaurus 時出現「Port 3000 already in use」

**原因**：Next.js 開發模式已佔用 port 3000

**解決方案**：
1. 停止 Next.js 服務（Ctrl+C）
2. 或修改 Docusaurus port：`npm start -- --port 3001`

---

#### Q3：前端無法連接後端 API

**檢查項目**：
1. 確認後端服務已啟動（http://localhost:8080/dynamic-api）
2. 確認 `.env.development` 中 `BACKEND_API_URL=http://localhost:8080`
3. 檢查 CORS 配置（`backend/src/main/java/com/dynamicapi/config/WebConfig.java`）

---

#### Q4：生產模式前端頁面 404

**原因**：未執行前端建置或建置失敗

**解決方案**：
```bash
cd backend
.\gradlew.bat clean bootJar
```
確保建置日誌顯示 `buildNextjs` 任務成功執行

---

### 推薦開發流程

#### 日常開發
```bash
# 終端機 1：啟動後端
cd backend
.\gradlew.bat bootRun

# 終端機 2：啟動前端
cd nextjs-dynamic-api-manager
npm run dev
```

#### 查閱文件時
```bash
# 額外終端機 3：啟動文檔（修改 port）
cd website
npm start -- --port 3001
```

#### 測試部署前
```bash
# 建置生產版本
cd backend
.\gradlew.bat bootJar

# 執行 JAR 測試
java -jar backend/build/libs/backend-0.0.1-SNAPSHOT.jar
```

---

## 架構說明

### 動態加載機制

系統使用自訂的 `DynamicClassLoader`（繼承自 `CustomClassLoader`）來實現 JAR 的動態加載：

**Web Service 動態加載流程**：
1. 上傳 JAR 檔案 → 儲存到資料庫的 `jar_file` 表
2. 新增 Endpoint → 建立 `endpoint` 記錄，關聯到 JAR 檔案
3. 啟用 Endpoint → `DynamicWebServiceImpl.switchWebService()` 從 JAR 載入類別
4. 使用 Apache CXF 的 `Endpoint.publish()` 發布 Web Service
5. 關鍵類別：`DynamicWebServiceImpl`、`WebServiceHandler`

**RESTful 動態加載流程**：
1. 上傳 JAR 檔案 → 儲存到資料庫的 `jar_file` 表
2. 新增 Controller → 建立 `controller` 記錄，關聯到 JAR 檔案
3. 啟用 Controller → `DynamicControllerServiceImpl.switchController()` 從 JAR 載入類別
4. 使用 Spring 的 `RequestMappingHandlerMapping` 動態註冊 Controller
5. 關鍵類別：`DynamicControllerServiceImpl`、`RequestMappingHandlerMapping`

### Mock 回應機制

**回應匹配邏輯**（在 base-jar 中實現）：
- 自訂的 Endpoint/Restful JAR 必須繼承 `WebserviceBase` 或 `RestfulBase`
- 使用 `findByPrimaryKey(publishUri, method, condition, clazz)` 查詢回應
- 從 `mock_response` 表根據複合主鍵（publish_uri, method, condition, service_type）查找
- 回應內容（response_content）可以是 XML 或 JSON 格式

**範例**（在 WebserviceBase/RestfulBase 中）：
```java
protected <T> T findByPrimaryKey(String publishUri, String method, String condition, Class<T> clazz) {
    return mockResponseDao.findByPrimaryKey(publishUri, method, condition, ServiceType.ENDPOINT/RESTFUL, clazz);
}
```

### 前後端整合模式

**開發模式**：
- 前端：Next.js Dev Server (localhost:3000)
- 後端：Spring Boot (localhost:8080)
- 前端通過 CORS 調用後端 API
- API 代理路由：`/api/dynamic-api/*` → `http://localhost:8080/dynamic-api/*`

**生產模式**：
- 執行 `gradlew bootRun` 時自動建置 Next.js
- Next.js 建置產物複製到 `backend/src/main/resources/static`
- Spring Boot 透過 `SpaController` 提供前端靜態檔案
- 訪問：http://localhost:8080/dynamic-api/

### 資料庫架構

使用 SQLite 嵌入式資料庫，主要表格：

- **jar_file**：儲存上傳的 JAR 檔案內容（BLOB）
  - id, file_name, file_content, status (UNUSED/INUSED)

- **endpoint**：WSDL Web Service 端點
  - id, publish_uri, bean_name, class_path, jar_file_id, is_active

- **controller**：RESTful API Controller
  - id, publish_uri, class_path, jar_file_id, is_active

- **mock_response**：模擬回應內容
  - publish_uri, method, condition, service_type (複合主鍵)
  - response_content, is_active

### 專案結構

```
dynamic-api/
├── docs/                       # 完整文件（單一檔案版本）
│   ├── srs.md                  # 需求規格書（完整版）
│   └── sdd.md                  # 設計規格書（完整版）
│
├── website/                    # Docusaurus 線上文件網站
│   ├── docs/                   # 文件內容（分章節）
│   │   ├── srs/                # SRS 章節
│   │   │   ├── intro.md
│   │   │   ├── introduction/   # 簡介（5 個檔案）
│   │   │   └── overview/       # 系統概述（4 個檔案）
│   │   └── sdd/                # SDD 章節
│   │       └── intro.md
│   ├── src/                    # 網站原始碼
│   │   └── pages/index.js      # 首頁
│   ├── static/                 # 靜態資源
│   ├── docusaurus.config.js    # Docusaurus 配置
│   ├── sidebars.js             # 側邊欄配置
│   └── package.json            # 依賴管理
│
├── backend/                    # Spring Boot 後端
│   ├── src/main/java/com/dynamicapi/
│   │   ├── controller/        # REST API Controllers
│   │   │   ├── WebServiceController.java      # Endpoint 管理 API
│   │   │   ├── DynamicLoadController.java     # Restful 管理 API
│   │   │   └── CommonController.java          # JAR 上傳、Response 管理 API
│   │   ├── service/impl/
│   │   │   ├── DynamicWebServiceImpl.java     # Endpoint 動態加載邏輯
│   │   │   ├── DynamicControllerServiceImpl.java  # Restful 動態加載邏輯
│   │   │   └── CommonServiceImpl.java         # JAR 和 Response 管理邏輯
│   │   ├── util/
│   │   │   ├── DynamicClassLoader.java        # 自訂類別載入器
│   │   │   ├── WebServiceHandler.java         # Web Service 處理器
│   │   │   └── Wsdl2JavaUtil.java             # WSDL 轉 Java 工具
│   │   ├── config/
│   │   │   ├── WebConfig.java                 # CORS 配置
│   │   │   └── SpaController.java             # SPA 路由控制器
│   │   ├── entity/            # JPA 實體
│   │   ├── repository/        # JPA Repositories
│   │   └── jdbc/              # JDBC 查詢（複雜查詢）
│   └── src/main/resources/
│       ├── application.yml    # Spring Boot 配置
│       ├── db.migration/      # Flyway 資料庫遷移腳本
│       └── static/            # 前端建置產物（生產模式）
│
├── nextjs-dynamic-api-manager/ # Next.js 前端
│   ├── src/
│   │   ├── app/
│   │   │   ├── endpoint/      # Endpoint 管理頁面
│   │   │   ├── restful/       # Restful 管理頁面
│   │   │   ├── response/      # Response 管理頁面
│   │   │   └── api/           # Next.js API 代理路由
│   │   ├── services/          # API 服務層
│   │   ├── components/        # React 組件
│   │   ├── forms/             # 表單組件
│   │   └── types/             # TypeScript 型別定義
│   ├── .env.development       # 開發環境配置
│   └── .env.production        # 生產環境配置
│
├── base-jar/                  # 基礎 JAR（提供基礎類別）
│   └── src/main/java/com/dynamicapi/
│       ├── jarbase/
│       │   ├── WebserviceBase.java    # Endpoint JAR 必須繼承
│       │   └── RestfulBase.java       # Restful JAR 必須繼承
│       ├── dao/
│       │   └── MockResponseDao.java   # Mock 回應 DAO
│       └── jdbc/
│           └── MockResponseJDBC.java  # Mock 回應 JDBC 查詢
│
├── endpoints/                 # WSDL Endpoint JAR 範例
│   └── company-endpoint/
│       └── src/main/java/com/company/
│           ├── webservice/
│           │   ├── CompanyWebService.java       # WebService 介面
│           │   └── impl/CompanyWebServiceImpl.java  # 實作（繼承 WebserviceBase）
│           └── dto/           # WSDL DTO 類別
│
└── restfuls/                  # RESTful API JAR 範例
    └── company-restful/
        └── src/main/java/com/company/
            ├── controller/
            │   └── CompanyController.java       # Controller（繼承 RestfulBase）
            └── dto/           # REST DTO 類別
```

## 開發重點

### 自訂 JAR 開發規範

**開發 Endpoint JAR**：
1. 必須繼承 `com.dynamicapi.jarbase.WebserviceBase`
2. 需要依賴 base-jar（放在 `src/main/lib/base.jar`）
3. 使用 `findByPrimaryKey()` 從資料庫取得 mock 回應
4. 使用 JAX-WS 註解（`@WebService`、`@WebMethod` 等）

**開發 Restful JAR**：
1. 必須繼承 `com.dynamicapi.jarbase.RestfulBase`
2. 需要依賴 base-jar（放在 `src/main/lib/base.jar`）
3. 使用 `findByPrimaryKey()` 從資料庫取得 mock 回應
4. 使用 Spring 註解（`@RestController`、`@RequestMapping` 等）

### 環境配置要點

**CORS 配置**（`backend/src/main/java/com/dynamicapi/config/WebConfig.java`）：
- 允許來源：`http://localhost:3000`（開發模式前端）
- 允許方法：GET, POST, PUT, DELETE, OPTIONS, PATCH
- 允許憑證：true

**環境變數**（Next.js）：
- `.env.development`：`NEXT_PUBLIC_API_URL=http://localhost:8080`
- `.env.production`：`NEXT_PUBLIC_API_URL=/dynamic-api`
- 以 `NEXT_PUBLIC_` 開頭的變數會暴露給客戶端

**資料庫遷移**：
- 使用 Flyway 管理資料庫版本
- 遷移腳本位於：`backend/src/main/resources/db.migration/`
- SQLite 資料庫檔案：`backend/database/dynamic-api.db`

### API 端點概覽

**Endpoint 管理** (`/dynamic-api/ws/`)：
- `GET /getEndpoints` - 取得 Endpoint 清單
- `POST /saveWebService` - 新增 Endpoint
- `POST /updateWebService` - 更新 Endpoint
- `DELETE /removeWebService` - 刪除 Endpoint
- `GET /switchWebService` - 切換啟用狀態
- `POST /genWsdlObj` - WSDL 轉 Java 物件

**Restful 管理** (`/dynamic-api/api/`)：
- `GET /getControllers` - 取得 Controller 清單
- `POST /saveController` - 新增 Controller
- `POST /updateController` - 更新 Controller
- `DELETE /removeController` - 刪除 Controller
- `GET /switchController` - 切換啟用狀態

**共用功能** (`/dynamic-api/common/`)：
- `POST /uploadJarFile` - 上傳 JAR 檔案
- `POST /getResponseList` - 取得 Response 清單
- `POST /saveMockResponse` - 新增 Response
- `POST /updateResponse` - 更新 Response
- `DELETE /deleteResponse` - 刪除 Response
- `GET /switchResponse` - 切換 Response 狀態

## 特殊注意事項

### Gradle 建置流程

當執行 `gradlew bootRun` 或 `gradlew bootJar` 時：
1. 觸發 `buildFrontend` 任務
2. 執行 `installNextjs`（npm install）
3. 執行 `buildNextjs`（npm run build，環境變數 NODE_ENV=production）
4. 執行 `copyNextjsBuild`（複製 Next.js 建置產物到 static/）
5. 重命名頁面路由（endpoint.html, restful.html 等）

### 類別載入器隔離

- 每個 JAR 檔案使用獨立的 `DynamicClassLoader` 實例
- 透過 `ClassLoaderSingletonEnum` 管理多個 ClassLoader
- 確保不同 JAR 的類別不會衝突

### 版本資訊

- Java: OpenJDK 17+（實際配置為 17，README 寫 21 需確認）
- Spring Boot: 3.2.5
- Node.js: 22+
- Next.js: 15.5.4
- Gradle: 8.7+

### 已知限制

- SQLite 不支援某些並發寫入操作
- JAR 動態卸載需要手動管理 ClassLoader 生命週期
- Next.js 靜態導出限制了某些伺服器端功能
