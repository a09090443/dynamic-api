[![official JetBrains project](https://jb.gg/badges/official.svg)](https://confluence.jetbrains.com/display/ALL/JetBrains+on+GitHub)

# Dynamic API Manager

可製作虛擬的 WSDL 或 REST JAR 動態加載至服務，並根據 request 條件回應內容。

## 📋 專案列表

- **backend**: 動態加載後端服務（Spring Boot）
- **nextjs-dynamic-api-manager**: 前端管理界面（Next.js）
- **docs-site**: 線上文檔網站（Docusaurus）
- **base-jar**: 提供自製 WSDL 或 REST JAR 所需的功能
- **endpoints**: WSDL endpoint JAR 範例
- **restfuls**: RESTful API JAR 範例
- **postman**: WSDL 和 REST 測試範例

---

## 🛠️ 開發環境

- **Java**: OpenJDK 21+
- **Spring Boot**: 3.2.5
- **Node.js**: 22+
- **Next.js**: 15.5.4
- **Gradle**: 8.7+

**支援平台**: Windows, macOS, Linux

---

## 🚀 快速啟動

### 方式一：生產模式（推薦用於測試部署）

適合測試完整的前後端集成。

**Windows**:
```powershell
cd backend
.\gradlew.bat bootRun
```

**macOS / Linux**:
```bash
cd backend
./gradlew bootRun
```

**訪問**: http://localhost:8080/dynamic-api/

**特點**:
- ✅ 完整的前後端集成
- ✅ 自動建置前端
- ✅ 模擬生產環境

### 方式二：開發模式（推薦用於前端開發）

適合需要熱更新的前端開發。

**步驟 1**: 啟動後端（第一個終端）

**Windows**:
```powershell
cd backend
.\gradlew.bat bootRun
```

**macOS / Linux**:
```bash
cd backend
./gradlew bootRun
```

**步驟 2**: 啟動前端（第二個終端）

**所有平台**:
```bash
cd nextjs-dynamic-api-manager
npm run dev
```

**訪問**:
- 前端開發伺服器: http://localhost:3000/endpoint
- 後端 API: http://localhost:8080/dynamic-api/

**特點**:
- ✅ 前端熱更新支持
- ✅ 快速迭代開發
- ✅ 前後端分離
- ✅ 支援 CORS 跨域調用
- ✅ 環境自動隔離，無需手動設定

---

## 📚 文檔服務（Docusaurus）

本專案提供線上文檔網站，使用 Docusaurus 建置，包含完整的系統需求規格書（SRS）和設計規格書（SDD）。

### 啟動文檔開發伺服器

**所有平台**:
```bash
cd docs-site
npm install  # 首次需要
npm start
```

**預設訪問**: http://localhost:3000

### ⚠️ Port 衝突解決方案

由於 Next.js 開發模式也使用 port 3000，若需同時啟動前端與文檔，請使用以下任一方式：

**方案 1：修改 Docusaurus Port**（推薦）
```bash
cd docs-site
npm start -- --port 3001
```
**訪問**: http://localhost:3001

**方案 2：修改 Next.js Port**
```bash
cd nextjs-dynamic-api-manager
npm run dev -- -p 3001
```
**訪問**: http://localhost:3001/endpoint

### 建置文檔網站

```bash
cd docs-site
npm run build
```

建置產物位於: `docs-site/build/`

### 預覽建置產物

```bash
cd docs-site
npm run serve
```

### 清除文檔快取

```bash
cd docs-site
npm run clear
```

---

## 🔨 JAR 模組建置

### 建置 base-jar（基礎類別庫）

base-jar 提供基礎類別給自訂 JAR 使用，必須先建置此模組。

**Windows**:
```powershell
cd base-jar
.\gradlew.bat build
```

**macOS / Linux**:
```bash
cd base-jar
./gradlew build
```

建置產物位於: `base-jar/build/libs/base-jar-0.0.1-SNAPSHOT.jar`

### 建置 Endpoint JAR 範例

**Windows**:
```powershell
cd endpoints/company-endpoint
.\gradlew.bat build
```

**macOS / Linux**:
```bash
cd endpoints/company-endpoint
./gradlew build
```

建置產物位於: `endpoints/company-endpoint/build/libs/company-endpoint-0.0.1-SNAPSHOT.jar`

### 建置 RESTful JAR 範例

**Windows**:
```powershell
cd restfuls/company-restful
.\gradlew.bat build
```

**macOS / Linux**:
```bash
cd restfuls/company-restful
./gradlew build
```

建置產物位於: `restfuls/company-restful/build/libs/company-restful-0.0.1-SNAPSHOT.jar`

---

## 📦 建置與部署

### 建置 JAR 檔案

**Windows**:
```powershell
cd backend
.\gradlew.bat bootJar
```

**macOS / Linux**:
```bash
cd backend
./gradlew bootJar
```

建置產物位於: `backend/build/libs/backend-0.0.1-SNAPSHOT.jar`

### 執行 JAR 檔案

```bash
cd backend/build/libs
java -jar backend-0.0.1-SNAPSHOT.jar
```

---

## 📖 功能說明

### 1. Endpoint 管理

管理 WSDL Web Service Endpoints

- 新增/編輯/刪除 Endpoint
- 上傳 JAR 檔案
- 動態啟用/停用
- 設定回應內容

### 2. RESTful API 管理

管理 RESTful API Endpoints

- 新增/編輯/刪除 RESTful API
- 支援 GET/POST/PUT/DELETE
- 上傳 JAR 檔案
- 動態設定回應

### 3. Response 管理

設定回應內容規則

- 根據 request 條件設定不同回應
- 支援 XML/JSON 格式
- 可設定延遲時間
- 支援動態參數

### 4. API 測試

內建 API 測試工具

- 測試 WSDL/REST API
- 查看 request/response
- 支援參數替換

**💡 提示**: 詳細的界面截圖請參考下方的 [🖼️ 運行畫面](#️-運行畫面) 章節。

---

## 🚦 服務啟動策略

### 服務概覽與 Port 配置

Dynamic API Manager 包含 3 個獨立服務，每個服務都有各自的 Port 配置：

| 服務 | Port | 用途 | 啟動模式 |
|------|------|------|---------|
| **後端服務** | 8080 | Spring Boot API + 動態載入引擎 | 必須啟動 |
| **前端服務** | 3000 (開發) / 8080 (生產) | Next.js 管理介面 | 開發模式可選 |
| **文檔服務** | 3000 (預設) / 3001 (建議) | Docusaurus 線上文件 | 可選 |

### Port 衝突問題

由於 **Next.js 開發模式** 與 **Docusaurus** 預設都使用 **port 3000**，若需同時啟動會發生衝突。

### 推薦啟動策略

#### 策略 1：僅開發應用（最常用）

**啟動順序**：
```bash
# 1. 啟動後端（必須）- Windows
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
# 1. 啟動後端（必須）- Windows
cd backend
.\gradlew.bat bootRun

# 2. 啟動前端（使用預設 port 3000）
cd nextjs-dynamic-api-manager
npm run dev

# 3. 啟動文檔（修改為 port 3001，避免衝突）
cd docs-site
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
cd docs-site
npm start
```

**訪問地址**：
- 線上文件：http://localhost:3000

**適用場景**：查閱系統文件、新成員了解系統

---

#### 策略 4：生產模式部署（單一服務）

**建置與啟動**：
```bash
# 建置（自動建置前端並整合）- Windows
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

## 🔌 API 端點參考

### Endpoint 管理 API (`/dynamic-api/ws/`)

管理 WSDL Web Service Endpoints

| 方法 | 端點 | 說明 |
|------|------|------|
| GET | `/getEndpoints` | 取得所有 Endpoint 清單 |
| POST | `/saveWebService` | 新增 Endpoint |
| POST | `/updateWebService` | 更新 Endpoint |
| DELETE | `/removeWebService` | 刪除 Endpoint |
| GET | `/switchWebService` | 切換 Endpoint 啟用狀態 |
| POST | `/genWsdlObj` | WSDL 轉 Java 物件 |

### RESTful 管理 API (`/dynamic-api/api/`)

管理 RESTful API Controllers

| 方法 | 端點 | 說明 |
|------|------|------|
| GET | `/getControllers` | 取得所有 Controller 清單 |
| POST | `/saveController` | 新增 Controller |
| POST | `/updateController` | 更新 Controller |
| DELETE | `/removeController` | 刪除 Controller |
| GET | `/switchController` | 切換 Controller 啟用狀態 |

### 共用功能 API (`/dynamic-api/common/`)

JAR 上傳與 Mock Response 管理

| 方法 | 端點 | 說明 |
|------|------|------|
| POST | `/uploadJarFile` | 上傳 JAR 檔案 |
| POST | `/getResponseList` | 取得 Response 清單 |
| POST | `/saveMockResponse` | 新增 Mock Response |
| POST | `/updateResponse` | 更新 Mock Response |
| DELETE | `/deleteResponse` | 刪除 Mock Response |
| GET | `/switchResponse` | 切換 Response 啟用狀態 |

---

## 🛠️ 自訂 JAR 開發指南

### 開發 Endpoint JAR（WSDL Web Service）

#### 必要條件

1. **繼承 WebserviceBase**

自訂的 Web Service 實作類別必須繼承 `com.dynamicapi.jarbase.WebserviceBase`

```java
package com.company.webservice.impl;

import com.dynamicapi.jarbase.WebserviceBase;
import javax.jws.WebService;

@WebService(serviceName = "CompanyService")
public class CompanyWebServiceImpl extends WebserviceBase {
    // 實作方法
}
```

2. **依賴 base-jar**

將 `base.jar` 放置在專案的 `src/main/lib/` 目錄下，並在 `build.gradle` 中配置：

```gradle
dependencies {
    implementation files('src/main/lib/base.jar')
}
```

3. **使用 Mock 回應**

透過 `findByPrimaryKey()` 方法從資料庫取得預設回應：

```java
public CompanyDTO getCompany(String companyId) {
    // 從資料庫查詢 Mock 回應
    return findByPrimaryKey(
        "/company/ws",           // publishUri
        "getCompany",            // method
        "companyId=" + companyId, // condition
        CompanyDTO.class         // 回應類別
    );
}
```

4. **使用 JAX-WS 註解**

```java
@WebService(serviceName = "CompanyService")
@SOAPBinding(style = SOAPBinding.Style.DOCUMENT)
public class CompanyWebServiceImpl extends WebserviceBase {

    @WebMethod
    public CompanyDTO getCompany(@WebParam(name = "companyId") String companyId) {
        return findByPrimaryKey("/company/ws", "getCompany", "companyId=" + companyId, CompanyDTO.class);
    }
}
```

#### 建置與部署

```bash
# Windows
cd endpoints/your-endpoint
.\gradlew.bat build

# macOS / Linux
cd endpoints/your-endpoint
./gradlew build
```

建置完成後，透過前端介面上傳 JAR 檔案並啟用。

---

### 開發 RESTful JAR

#### 必要條件

1. **繼承 RestfulBase**

自訂的 Controller 必須繼承 `com.dynamicapi.jarbase.RestfulBase`

```java
package com.company.controller;

import com.dynamicapi.jarbase.RestfulBase;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/company")
public class CompanyController extends RestfulBase {
    // 實作方法
}
```

2. **依賴 base-jar**

將 `base.jar` 放置在專案的 `src/main/lib/` 目錄下，並在 `build.gradle` 中配置：

```gradle
dependencies {
    implementation files('src/main/lib/base.jar')
}
```

3. **使用 Mock 回應**

透過 `findByPrimaryKey()` 方法從資料庫取得預設回應：

```java
@GetMapping("/getCompany")
public CompanyDTO getCompany(@RequestParam String id) {
    // 從資料庫查詢 Mock 回應
    return findByPrimaryKey(
        "/api/company",          // publishUri
        "getCompany",            // method
        "id=" + id,              // condition
        CompanyDTO.class         // 回應類別
    );
}
```

4. **使用 Spring 註解**

```java
@RestController
@RequestMapping("/api/company")
public class CompanyController extends RestfulBase {

    @GetMapping("/getCompany")
    public CompanyDTO getCompany(@RequestParam String id) {
        return findByPrimaryKey("/api/company", "getCompany", "id=" + id, CompanyDTO.class);
    }

    @PostMapping("/createCompany")
    public CompanyDTO createCompany(@RequestBody CompanyDTO company) {
        return findByPrimaryKey("/api/company", "createCompany", "", CompanyDTO.class);
    }
}
```

#### 建置與部署

```bash
# Windows
cd restfuls/your-restful
.\gradlew.bat build

# macOS / Linux
cd restfuls/your-restful
./gradlew build
```

建置完成後，透過前端介面上傳 JAR 檔案並啟用。

---

### Mock Response 設定

在前端介面的「Response 管理」頁面新增對應的 Mock 回應：

**範例設定**：

| 欄位 | 值 |
|------|------|
| Publish URI | `/api/company` |
| Method | `getCompany` |
| Condition | `id=123` |
| Service Type | `RESTFUL` |
| Response Content | `{"id": "123", "name": "測試公司", "code": "TEST"}` |

當系統接收到符合條件的請求時，會自動返回設定的 JSON 回應。

---

## 🔧 技術架構

### 後端技術棧

- **框架**: Spring Boot 3.2.5
- **資料庫**: SQLite (嵌入式)
- **建置工具**: Gradle 8.7
- **Java 版本**: 21

### 前端技術棧

- **框架**: Next.js 15.5.4 (App Router)
- **UI 庫**: Material-UI (MUI)
- **狀態管理**: React Hooks
- **HTTP 客戶端**: Axios
- **建置工具**: Turbopack

### 整合方式

```
開發模式:
  Next.js Dev Server (3000) ──[CORS]──> Spring Boot (8080)

生產模式:
  Spring Boot (8080)
    └── static/  (Next.js 建置產物)
```

### 動態加載機制

系統使用自訂的 `DynamicClassLoader`（繼承自 `CustomClassLoader`）來實現 JAR 的動態加載。

#### Web Service 動態加載流程

1. **上傳 JAR 檔案** → 儲存到資料庫的 `jar_file` 表（BLOB 格式）
2. **新增 Endpoint** → 建立 `endpoint` 記錄，關聯到 JAR 檔案
3. **啟用 Endpoint** → `DynamicWebServiceImpl.switchWebService()` 從 JAR 載入類別
4. **發布服務** → 使用 Apache CXF 的 `Endpoint.publish()` 發布 Web Service
5. **處理請求** → 透過 `WebServiceHandler` 處理 SOAP 請求

**關鍵類別**:
- `DynamicWebServiceImpl`: Endpoint 動態加載邏輯
- `WebServiceHandler`: Web Service 請求處理器
- `DynamicClassLoader`: 自訂類別載入器

#### RESTful 動態加載流程

1. **上傳 JAR 檔案** → 儲存到資料庫的 `jar_file` 表（BLOB 格式）
2. **新增 Controller** → 建立 `controller` 記錄，關聯到 JAR 檔案
3. **啟用 Controller** → `DynamicControllerServiceImpl.switchController()` 從 JAR 載入類別
4. **註冊路由** → 使用 Spring 的 `RequestMappingHandlerMapping` 動態註冊 Controller
5. **處理請求** → Spring MVC 自動路由到對應的 Controller 方法

**關鍵類別**:
- `DynamicControllerServiceImpl`: RESTful Controller 動態加載邏輯
- `RequestMappingHandlerMapping`: Spring 路由映射管理器
- `DynamicClassLoader`: 自訂類別載入器

#### 類別載入器隔離

- 每個 JAR 檔案使用獨立的 `DynamicClassLoader` 實例
- 透過 `ClassLoaderSingletonEnum` 管理多個 ClassLoader
- 確保不同 JAR 的類別不會衝突

### Mock 回應機制

系統透過複合條件匹配來返回預設的 Mock 回應內容。

#### 回應匹配邏輯

自訂的 Endpoint/Restful JAR 必須繼承 `WebserviceBase` 或 `RestfulBase`，透過以下方法查詢回應：

```java
protected <T> T findByPrimaryKey(String publishUri, String method, String condition, Class<T> clazz) {
    return mockResponseDao.findByPrimaryKey(publishUri, method, condition, ServiceType.ENDPOINT/RESTFUL, clazz);
}
```

#### 匹配條件

從 `mock_response` 表根據以下複合主鍵查找：
- **publish_uri**: 發布路徑（如 `/company/ws`, `/api/company`）
- **method**: 方法名稱（如 `getCompany`, `updateCompany`）
- **condition**: 額外條件（如 `companyId=123`，可為空）
- **service_type**: 服務類型（`ENDPOINT` 或 `RESTFUL`）

#### 回應格式

- 回應內容（`response_content`）可以是 **XML** 或 **JSON** 格式
- 支援動態參數替換
- 可設定延遲時間模擬真實環境

#### 範例流程

```
1. 接收請求: POST /api/company/getCompany?id=123
2. 執行方法: CompanyController.getCompany(id)
3. 查詢回應: findByPrimaryKey("/api/company", "getCompany", "id=123", CompanyDTO.class)
4. 返回結果: 從資料庫取得對應的 JSON 回應
```

### 資料庫架構

使用 **SQLite** 嵌入式資料庫，主要表格：

#### jar_file（JAR 檔案儲存）
儲存上傳的 JAR 檔案內容（BLOB 格式）

| 欄位 | 類型 | 說明 |
|------|------|------|
| id | INTEGER | 主鍵 |
| file_name | VARCHAR | 檔案名稱 |
| file_content | BLOB | JAR 檔案內容 |
| status | VARCHAR | 狀態（UNUSED/INUSED） |

#### endpoint（WSDL Web Service 端點）

| 欄位 | 類型 | 說明 |
|------|------|------|
| id | INTEGER | 主鍵 |
| publish_uri | VARCHAR | 發布路徑 |
| bean_name | VARCHAR | Bean 名稱 |
| class_path | VARCHAR | 類別完整路徑 |
| jar_file_id | INTEGER | 關聯的 JAR 檔案 ID |
| is_active | BOOLEAN | 是否啟用 |

#### controller（RESTful API Controller）

| 欄位 | 類型 | 說明 |
|------|------|------|
| id | INTEGER | 主鍵 |
| publish_uri | VARCHAR | 發布路徑 |
| class_path | VARCHAR | 類別完整路徑 |
| jar_file_id | INTEGER | 關聯的 JAR 檔案 ID |
| is_active | BOOLEAN | 是否啟用 |

#### mock_response（模擬回應內容）

| 欄位 | 類型 | 說明 |
|------|------|------|
| publish_uri | VARCHAR | 發布路徑（主鍵） |
| method | VARCHAR | 方法名稱（主鍵） |
| condition | VARCHAR | 額外條件（主鍵） |
| service_type | VARCHAR | 服務類型（主鍵） |
| response_content | TEXT | 回應內容（XML/JSON） |
| is_active | BOOLEAN | 是否啟用 |

---

## 📝 配置說明

### 環境變數配置

**開發模式** (`.env.local`):
```env
NEXT_PUBLIC_APP_ENV=development
NEXT_PUBLIC_API_URL=http://localhost:8080
BACKEND_API_URL=http://localhost:8080
NEXT_PUBLIC_DEBUG_MODE=true
```

**生產模式** (`.env.production`):
```env
NEXT_PUBLIC_APP_ENV=production
NEXT_PUBLIC_API_URL=/dynamic-api
BACKEND_API_URL=http://localhost:8080
NEXT_PUBLIC_DEBUG_MODE=false
```

### CORS 配置

開發模式需要 CORS 支持，已在 `WebConfig.java` 中配置：

```java
@Override
public void addCorsMappings(CorsRegistry registry) {
    registry.addMapping("/**")
            .allowedOrigins("http://localhost:3000")  // npm dev
            .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH")
            .allowedHeaders("*")
            .allowCredentials(true);
}
```

---

## 🎯 常見問題

### Q: 啟動 Next.js 時出現「Port 3000 already in use」

**A**: Docusaurus 已佔用 port 3000

**解決方案**：
1. 停止 Docusaurus 服務（Ctrl+C）
2. 或修改 Next.js port：`npm run dev -- -p 3001`

### Q: 啟動 Docusaurus 時出現「Port 3000 already in use」

**A**: Next.js 開發模式已佔用 port 3000

**解決方案**：
1. 停止 Next.js 服務（Ctrl+C）
2. 或修改 Docusaurus port：`npm start -- --port 3001`

### Q: npm dev 顯示 API 錯誤？

**A**: 確保後端已啟動且 CORS 配置正確。

**檢查項目**：
1. 確認後端服務已啟動（http://localhost:8080/dynamic-api）
2. 確認 `.env.development` 中 `BACKEND_API_URL=http://localhost:8080`
3. 檢查 CORS 配置（`backend/src/main/java/com/dynamicapi/config/WebConfig.java`）

### Q: 生產模式前端頁面 404？

**A**: 未執行前端建置或建置失敗

**解決方案**：
```bash
cd backend
.\gradlew.bat clean bootJar
```
確保建置日誌顯示 `buildNextjs` 任務成功執行

### Q: 如何清理建置快取？

**A**: 

**Windows**:
```powershell
# 清理 Gradle 快取
cd backend
.\gradlew.bat clean

# 清理 Next.js 快取
cd nextjs-dynamic-api-manager
Remove-Item .next, out -Recurse -Force
```

**macOS / Linux**:
```bash
# 清理 Gradle 快取
cd backend
./gradlew clean

# 清理 Next.js 快取
cd nextjs-dynamic-api-manager
rm -rf .next out
```

### Q: 開發模式啟動問題？

**A**: 

確保 Node.js 和後端都已正確安裝和啟動：

```bash
# 檢查環境
java -version  # 需要 21+
node -version  # 需要 22+

# 安裝依賴（首次）
cd nextjs-dynamic-api-manager
npm install

# 啟動
npm run dev
```

**注意**: 由於環境已隔離，npm dev 不需要清除 NODE_ENV，直接執行即可。

### Q: Gradle wrapper 無執行權限？（Linux/macOS）

**A**:
```bash
chmod +x gradlew
```

---

## 📚 進階文檔

- **CORS配置驗證報告.md**: CORS 配置說明與驗證結果
- **環境隔離說明.md**: 開發/生產環境隔離原理
- **PROJECT_STRUCTURE.md**: 專案結構詳細說明
- **QUICK_START.md**: 快速上手指南
- **docs/srs.md**: 完整需求規格書（SRS）
- **docs/sdd.md**: 完整設計規格書（SDD）
- **docs-site/**: Docusaurus 線上文檔網站（分章節版本）

---

## 🖼️ 運行畫面

### Endpoint 管理界面
管理 WSDL Web Service Endpoints，支援動態加載和設定回應內容。

![Endpoint Dashboard](./images/endpoint_dashboard.png)

### RESTful API 管理界面
管理 RESTful API，支援多種 HTTP 方法和動態回應設定。

![RESTful Dashboard](./images/restful_dashboard.png)

### 新增 Endpoint
上傳 JAR 檔案並設定 WSDL Endpoint 的詳細資訊。

![Create Endpoint](./images/create_new_endpoint.png)

### 新增 RESTful API
設定 RESTful API 的路徑、方法和回應內容。

![Create RESTful](./images/create_new_restful.png)

---

## 🔄 版本更新

### v2.0.0 (2025-01)
- ✅ 前端遷移至 Next.js 15
- ✅ 整合 Gradle 自動建置
- ✅ 支援開發/生產環境隔離
- ✅ 添加 CORS 支持
- ✅ 使用 Turbopack 加速建置
- ✅ 跨平台支援（Windows, macOS, Linux）
- ✅ 新增 Docusaurus 線上文檔網站
- ✅ 完整的 API 端點參考文檔
- ✅ 自訂 JAR 開發指南

### v1.0.0
- 初始版本（Angular 17 + Spring Boot）

---

## 💻 環境隔離機制

### Gradle 與 npm 環境完全隔離

本專案已實現環境隔離，確保開發和生產環境互不干擾：

**Gradle 建置（生產模式）**:
```gradle
// build.gradle 中明確設定
environment 'NODE_ENV', 'production'
```
- ✅ 只在 Gradle 任務執行時有效
- ✅ 不影響系統環境變數
- ✅ 任務結束後自動清除

**npm dev（開發模式）**:
```bash
npm run dev
```
- ✅ Next.js 自動使用開發模式
- ✅ 不需要設定 NODE_ENV
- ✅ 完全獨立於 Gradle

**結論**: 開發時直接執行 `npm run dev`，無需任何環境變數操作。

---

## 💻 跨平台說明

### Gradle Wrapper

專案使用 Gradle Wrapper，確保所有平台使用相同的 Gradle 版本：

- **Windows**: `gradlew.bat`
- **macOS / Linux**: `./gradlew`

### Node.js 工具鏈

專案在 `tools/` 目錄包含預先下載的 Node.js 版本（可選用），或使用系統安裝的 Node.js。

**推薦**: 使用系統安裝的 Node.js 22+ 以獲得最佳相容性和效能。

---

## 👥 聯絡方式

如有興趣想討論，或有任何想法想加入開發，歡迎聯絡：

📧 Email: zipe.daden@gmail.com

---

## 📄 授權

本專案為 JetBrains 官方專案。

---

## 🚀 快速開始

**一行命令啟動**:

```bash
# Windows
cd backend && .\gradlew.bat bootRun

# macOS / Linux
cd backend && ./gradlew bootRun
```

**然後訪問**: http://localhost:8080/dynamic-api/

**開發模式**: 查看上方「🚀 快速啟動 - 方式二」

---

## 💡 推薦開發流程

### 日常開發

```bash
# 終端機 1：啟動後端
cd backend
.\gradlew.bat bootRun

# 終端機 2：啟動前端
cd nextjs-dynamic-api-manager
npm run dev
```

### 查閱文件時

```bash
# 額外終端機 3：啟動文檔（修改 port）
cd docs-site
npm start -- --port 3001
```

### 測試部署前

```bash
# 建置生產版本
cd backend
.\gradlew.bat bootJar

# 執行 JAR 測試
java -jar backend/build/libs/backend-0.0.1-SNAPSHOT.jar
```
