# Dynamic API Manager - 軟體需求規格書（SRS）

---

## 0. 文件資訊

- **文件名稱**：Dynamic API Manager 軟體需求規格書
- **系統／專案名稱**：Dynamic API Manager
- **版本**：1.0.0
- **修訂日期**：2026-01-02
- **作者**：開發團隊
- **審核／核准**：待審核
- **適用範圍**：本系統所有功能模組與介面

---

## 1. 簡介

### 1.1 文件目的

本文件旨在明確定義 Dynamic API Manager 系統的功能性與非功能性需求，作為系統開發、測試與驗收的依據。預期讀者能從本文件中了解：

- 系統要解決的業務問題與目標
- 系統功能範圍與邊界
- 各功能模組的詳細需求與驗收標準
- 非功能性需求（效能、安全、可用性等）
- 外部介面規格與資料模型

### 1.2 系統範圍（本系統要解決的問題與邊界）

**要解決的問題**：
- 傳統的 Web Service 與 RESTful API 部署需要重新編譯、打包、重啟應用程式，導致服務中斷與部署時間長
- 測試環境需要快速切換不同版本的 API 實作與 Mock 回應，傳統方式缺乏彈性
- 多個 API 服務的 Mock 回應管理分散，難以統一維護

**系統涵蓋範圍**：
- WSDL Web Service（SOAP）的動態載入與發布
- RESTful API Controller 的動態載入與註冊
- JAR 檔案的上傳、儲存與版本管理
- Mock 回應規則的建立、編輯與切換
- 前端管理介面（Endpoint、Restful、Response 管理）
- WSDL 轉 Java 工具（輔助開發）

**系統邊界（不處理的範圍）**：
- 不提供 API Gateway 功能（如：流量控制、API Key 管理）
- 不提供 API 版本控制與向後相容性管理
- 不提供分散式部署與叢集管理
- 不提供自動化測試或 API 測試工具
- 不處理 GraphQL 或 gRPC 協定

### 1.3 讀者與角色（PM、BA、架構師、開發、QA、Ops…）

| 角色 | 說明 |
|------|------|
| **專案經理（PM）** | 了解專案範圍、功能優先級與驗收標準 |
| **業務分析師（BA）** | 確認需求完整性與業務規則正確性 |
| **系統架構師** | 理解系統邊界、外部介面與非功能需求 |
| **後端開發** | 根據需求設計與實作功能模組 |
| **前端開發** | 根據 UI 需求設計與實作管理介面 |
| **QA 測試** | 依驗收標準設計測試案例與執行驗證 |
| **維運人員（Ops）** | 了解部署需求、效能指標與監控項目 |

### 1.4 名詞定義與縮寫

| 名詞／縮寫 | 定義 |
|-----------|------|
| **Endpoint** | 本系統中指 WSDL Web Service 端點 |
| **Restful** | 本系統中指 RESTful API Controller |
| **JAR File** | Java Archive，包含編譯後的 Java 類別與資源的壓縮檔案 |
| **Mock Response** | 模擬回應，根據條件規則返回預先設定的回應內容 |
| **動態載入** | 在運行時（Runtime）從 JAR 檔案中載入類別，無需重啟應用程式 |
| **發布 URI** | Publish URI，API 或 Web Service 的存取路徑 |
| **Condition** | 條件，用於匹配 Mock 回應的規則（如：request body、header、parameter） |
| **WSDL** | Web Services Description Language，Web Service 的描述語言 |
| **CXF** | Apache CXF，開源 Web Service 框架 |
| **ClassLoader** | Java 類別載入器，負責載入類別到 JVM |

### 1.5 參考文件（契約、政策、既有系統文件等）

- JAX-WS 規格（Java API for XML Web Services）
- Spring Framework 官方文件
- Apache CXF 官方文件
- SQLite 資料庫規格
- Next.js 官方文件

---

## 2. 系統概述

### 2.1 系統目標

Dynamic API Manager 的主要目標為：

1. **提升 API 部署效率**：實現 Web Service 與 RESTful API 的熱部署，無需重啟應用程式
2. **簡化測試流程**：快速切換不同版本的 API 實作與 Mock 回應，加速測試週期
3. **統一 Mock 管理**：集中管理多個 API 服務的 Mock 回應規則
4. **降低技術門檻**：提供視覺化管理介面，減少手動操作與配置錯誤
5. **支援多種協定**：同時支援 WSDL Web Service（SOAP）與 RESTful API

### 2.2 目標使用者與利害關係人

**主要使用者**：
- **後端開發人員**：開發與部署 JAR 模組，配置 Endpoint 與 Restful
- **測試人員**：管理 Mock 回應規則，切換不同測試情境
- **整合人員**：管理外部系統整合的 API Mock

**次要使用者**：
- **專案經理**：查看系統狀態與部署進度
- **維運人員**：監控系統健康狀態與效能指標

**利害關係人**：
- **客戶／業主**：期待縮短 API 開發與測試週期
- **合作廠商**：需要整合的外部系統提供者

### 2.3 主要使用情境（Use Cases / User Stories 概述）

**UC-1：動態部署 Web Service**
- 開發人員上傳包含 Web Service 實作的 JAR 檔案
- 設定 Publish URI、Bean Name 與 Class Path
- 啟用 Endpoint 後，外部系統可透過 WSDL 存取服務

**UC-2：動態部署 RESTful API**
- 開發人員上傳包含 RestController 實作的 JAR 檔案
- 設定 Publish URI 與 Class Path
- 啟用 Controller 後，客戶端可透過 HTTP 存取 API

**UC-3：管理 Mock 回應規則**
- 測試人員新增 Mock 回應規則，設定 Publish URI、Method、Condition
- 設定回應內容（XML 或 JSON）
- 啟用回應規則後，符合條件的請求將返回預設回應

**UC-4：切換 API 版本**
- 維護人員停用舊版 Endpoint/Restful
- 啟用新版 Endpoint/Restful
- 系統無需重啟即可完成版本切換

**UC-5：WSDL 轉 Java 輔助開發**
- 開發人員上傳 WSDL 檔案
- 系統自動產生對應的 Java 類別（DTO、Service Interface）
- 開發人員基於產生的程式碼開發 JAR 模組

### 2.4 高階系統架構（僅文字＋簡圖說明，不含過多技術細節）

**邏輯架構**：

```
┌─────────────────────────────────────────────────────────┐
│                    前端管理介面                          │
│         (Next.js - Endpoint/Restful/Response 管理)       │
└────────────────────┬────────────────────────────────────┘
                     │ HTTP API
┌────────────────────┴────────────────────────────────────┐
│                    後端 API 層                           │
│   (WebServiceController, DynamicLoadController, etc.)   │
└────────────────────┬────────────────────────────────────┘
                     │
         ┌───────────┴───────────┐
         │                       │
┌────────┴────────┐   ┌─────────┴──────────┐
│  動態載入服務   │   │   Mock 回應服務    │
│ (DynamicWebSvc) │   │  (CommonService)   │
│ (DynamicCtrlSvc)│   │                    │
└────────┬────────┘   └─────────┬──────────┘
         │                      │
         │          ┌───────────┴──────────┐
         │          │                      │
┌────────┴──────────┴───┐      ┌──────────┴──────────┐
│   ClassLoader 管理     │      │   資料持久化層      │
│ (DynamicClassLoader)   │      │ (JPA + JDBC)        │
└────────────────────────┘      └──────────┬──────────┘
                                           │
                                ┌──────────┴──────────┐
                                │   SQLite 資料庫     │
                                │ (JAR/Endpoint/Ctrl/ │
                                │  MockResponse)      │
                                └─────────────────────┘
```

**互動流程**：
1. 使用者透過前端介面上傳 JAR 檔案
2. 後端 API 接收並儲存 JAR 內容到資料庫
3. 使用者建立 Endpoint/Restful 配置並啟用
4. 動態載入服務從資料庫讀取 JAR 內容，使用 ClassLoader 載入類別
5. 對於 Endpoint：使用 Apache CXF 發布 Web Service
6. 對於 Restful：使用 Spring RequestMappingHandlerMapping 註冊 Controller
7. 外部請求透過動態載入的服務處理，根據 Mock 規則返回回應

---

## 3. 功能性需求 (Functional Requirements)

### 3.1 JAR 檔案管理模組

#### FR-JAR-001：上傳 JAR 檔案
- **描述**：系統應允許使用者上傳 JAR 檔案，並儲存到資料庫
- **觸發者（Actor）**：開發人員、測試人員
- **前置條件**：
  - 使用者已登入系統（<!-- TODO: 認證機制未定義 -->）
  - JAR 檔案符合格式要求（.jar 副檔名）
- **後置條件**：
  - JAR 檔案內容以 BLOB 格式儲存到 `jar_file` 表
  - 檔案狀態設為 `UNUSED`
  - 返回檔案 ID 給前端
- **輸入／輸出**：
  - 輸入：JAR 檔案（Multipart File）
  - 輸出：檔案 ID、檔案名稱、上傳時間
- **業務規則**：
  - 檔案大小限制：最大 50MB
  - 檔案名稱不可重複（同名檔案自動加上時間戳記）
  - 僅支援 .jar 格式
- **驗收標準**：
  - 成功上傳後可在檔案清單中看到該檔案
  - 檔案內容正確儲存（可下載驗證）
  - 超過大小限制時顯示錯誤訊息
  - 非 .jar 檔案上傳時顯示格式錯誤

#### FR-JAR-002：查詢 JAR 檔案清單
- **描述**：系統應提供 JAR 檔案清單查詢，顯示檔案基本資訊與使用狀態
- **觸發者（Actor）**：開發人員、測試人員
- **前置條件**：資料庫中有 JAR 檔案記錄
- **後置條件**：返回檔案清單（不含 BLOB 內容）
- **輸入／輸出**：
  - 輸入：無（或分頁參數）
  - 輸出：檔案 ID、檔案名稱、狀態（UNUSED/INUSED）、上傳時間
- **業務規則**：
  - 狀態為 `INUSED` 的檔案表示正在被某個 Endpoint 或 Restful 使用
  - 清單依上傳時間倒序排列
- **驗收標準**：
  - 可正確顯示所有已上傳的 JAR 檔案
  - 狀態正確反映使用情況
  - 支援分頁（若檔案數量 > 20）

#### FR-JAR-003：刪除 JAR 檔案
- **描述**：系統應允許刪除未被使用的 JAR 檔案
- **觸發者（Actor）**：開發人員
- **前置條件**：
  - JAR 檔案存在
  - 檔案狀態為 `UNUSED`（未被任何 Endpoint/Restful 使用）
- **後置條件**：JAR 檔案記錄從資料庫中移除
- **輸入／輸出**：
  - 輸入：檔案 ID
  - 輸出：刪除成功／失敗訊息
- **業務規則**：
  - 狀態為 `INUSED` 的檔案不可刪除
  - 刪除前需顯示確認訊息
- **驗收標準**：
  - 成功刪除後檔案不再出現在清單中
  - 嘗試刪除使用中的檔案時顯示錯誤訊息
  - 顯示確認對話框，防止誤刪

---

### 3.2 Endpoint 管理模組（WSDL Web Service）

#### FR-EP-001：新增 Endpoint
- **描述**：系統應允許建立 WSDL Endpoint 配置，關聯 JAR 檔案與類別資訊
- **觸發者（Actor）**：開發人員
- **前置條件**：
  - 已上傳包含 Web Service 實作的 JAR 檔案
  - JAR 中的類別繼承自 `WebserviceBase`
- **後置條件**：
  - Endpoint 記錄儲存到 `endpoint` 表
  - JAR 檔案狀態更新為 `INUSED`
  - Endpoint 預設為停用狀態（`is_active = false`）
- **輸入／輸出**：
  - 輸入：
    - Publish URI（如：`/ws/company`）
    - Bean Name（Spring Bean 名稱）
    - Class Path（完整類別路徑，如：`com.company.webservice.impl.CompanyWebServiceImpl`）
    - JAR File ID
  - 輸出：Endpoint ID、建立時間
- **業務規則**：
  - Publish URI 不可重複
  - Publish URI 必須以 `/` 開頭
  - Bean Name 不可重複
  - Class Path 必須是 JAR 中存在的類別
- **驗收標準**：
  - 成功新增後可在 Endpoint 清單中看到該筆記錄
  - 重複 Publish URI 時顯示錯誤訊息
  - 無效的 Class Path 時顯示錯誤訊息

#### FR-EP-002：啟用 Endpoint
- **描述**：系統應將停用的 Endpoint 啟用，動態載入 JAR 並發布 Web Service
- **觸發者（Actor）**：開發人員、維運人員
- **前置條件**：
  - Endpoint 存在且為停用狀態
  - 關聯的 JAR 檔案存在
- **後置條件**：
  - Endpoint 狀態更新為 `is_active = true`
  - 從 JAR 載入指定的類別
  - 使用 Apache CXF 在指定的 Publish URI 發布 Web Service
  - 外部系統可透過 WSDL 存取服務
- **輸入／輸出**：
  - 輸入：Endpoint ID
  - 輸出：啟用成功／失敗訊息
- **業務規則**：
  - 同一 Publish URI 僅能有一個啟用的 Endpoint
  - 載入失敗時需回滾狀態變更
- **驗收標準**：
  - 啟用成功後狀態顯示為「已啟用」
  - 可透過 `http://localhost:8080/{publishUri}?wsdl` 存取 WSDL
  - 呼叫 Web Service 可正確返回回應
  - 啟用失敗時顯示詳細錯誤訊息（如：類別載入失敗、CXF 發布失敗）

#### FR-EP-003：停用 Endpoint
- **描述**：系統應將啟用的 Endpoint 停用，卸載 Web Service
- **觸發者（Actor）**：開發人員、維運人員
- **前置條件**：Endpoint 存在且為啟用狀態
- **後置條件**：
  - Endpoint 狀態更新為 `is_active = false`
  - 使用 Apache CXF 停止發布 Web Service
  - 外部系統無法再存取該服務
- **輸入／輸出**：
  - 輸入：Endpoint ID
  - 輸出：停用成功／失敗訊息
- **業務規則**：
  - 停用不會刪除 Endpoint 記錄
  - 停用後可重新啟用
- **驗收標準**：
  - 停用成功後狀態顯示為「已停用」
  - 存取 WSDL 時返回 404 錯誤
  - 停用失敗時顯示錯誤訊息

#### FR-EP-004：編輯 Endpoint
- **描述**：系統應允許編輯已停用的 Endpoint 配置
- **觸發者（Actor）**：開發人員
- **前置條件**：
  - Endpoint 存在
  - Endpoint 為停用狀態（<!-- TODO: 是否允許編輯啟用中的 Endpoint？ -->）
- **後置條件**：Endpoint 配置更新
- **輸入／輸出**：
  - 輸入：Endpoint ID、新的 Bean Name / Class Path / JAR File ID
  - 輸出：更新成功／失敗訊息
- **業務規則**：
  - 不可更改 Publish URI（若需更改，應刪除後重建）
  - 新的 Bean Name 不可與其他 Endpoint 重複
- **驗收標準**：
  - 更新後資訊正確顯示
  - 重新啟用後使用新的配置

#### FR-EP-005：刪除 Endpoint
- **描述**：系統應允許刪除已停用的 Endpoint
- **觸發者（Actor）**：開發人員
- **前置條件**：
  - Endpoint 存在
  - Endpoint 為停用狀態
- **後置條件**：
  - Endpoint 記錄從資料庫中移除
  - 若 JAR 檔案不再被其他 Endpoint/Restful 使用，狀態更新為 `UNUSED`
- **輸入／輸出**：
  - 輸入：Endpoint ID
  - 輸出：刪除成功／失敗訊息
- **業務規則**：
  - 啟用中的 Endpoint 不可刪除
  - 刪除前需顯示確認訊息
- **驗收標準**：
  - 成功刪除後記錄不再出現在清單中
  - 嘗試刪除啟用中的 Endpoint 時顯示錯誤訊息

#### FR-EP-006：查詢 Endpoint 清單
- **描述**：系統應提供 Endpoint 清單查詢，顯示所有 Endpoint 配置與狀態
- **觸發者（Actor）**：開發人員、測試人員、維運人員
- **前置條件**：無
- **後置條件**：返回 Endpoint 清單
- **輸入／輸出**：
  - 輸入：無（或篩選條件：狀態、JAR 檔案）
  - 輸出：Endpoint ID、Publish URI、Bean Name、狀態、JAR 檔案名稱、建立時間
- **業務規則**：
  - 清單依建立時間倒序排列
  - 狀態以視覺化方式顯示（如：綠色=已啟用、灰色=已停用）
- **驗收標準**：
  - 可正確顯示所有 Endpoint
  - 篩選功能正常運作
  - 狀態正確顯示

---

### 3.3 Restful 管理模組（RESTful API Controller）

#### FR-RF-001：新增 Restful Controller
- **描述**：系統應允許建立 Restful Controller 配置，關聯 JAR 檔案與類別資訊
- **觸發者（Actor）**：開發人員
- **前置條件**：
  - 已上傳包含 RestController 實作的 JAR 檔案
  - JAR 中的類別繼承自 `RestfulBase`
- **後置條件**：
  - Controller 記錄儲存到 `controller` 表
  - JAR 檔案狀態更新為 `INUSED`
  - Controller 預設為停用狀態（`is_active = false`）
- **輸入／輸出**：
  - 輸入：
    - Publish URI（如：`/api/company`）
    - Class Path（完整類別路徑，如：`com.company.controller.CompanyController`）
    - JAR File ID
  - 輸出：Controller ID、建立時間
- **業務規則**：
  - Publish URI 不可重複
  - Publish URI 必須以 `/` 開頭
  - Class Path 必須是 JAR 中存在的類別
  - 類別必須有 `@RestController` 或 `@Controller` 註解
- **驗收標準**：
  - 成功新增後可在 Restful 清單中看到該筆記錄
  - 重複 Publish URI 時顯示錯誤訊息
  - 無效的 Class Path 時顯示錯誤訊息

#### FR-RF-002：啟用 Restful Controller
- **描述**：系統應將停用的 Controller 啟用，動態載入 JAR 並註冊到 Spring MVC
- **觸發者（Actor）**：開發人員、維運人員
- **前置條件**：
  - Controller 存在且為停用狀態
  - 關聯的 JAR 檔案存在
- **後置條件**：
  - Controller 狀態更新為 `is_active = true`
  - 從 JAR 載入指定的類別
  - 使用 `RequestMappingHandlerMapping` 動態註冊 Controller
  - 外部系統可透過 HTTP 存取 API
- **輸入／輸出**：
  - 輸入：Controller ID
  - 輸出：啟用成功／失敗訊息
- **業務規則**：
  - 同一 Publish URI 僅能有一個啟用的 Controller
  - 載入失敗時需回滾狀態變更
- **驗收標準**：
  - 啟用成功後狀態顯示為「已啟用」
  - 可透過 HTTP Client 呼叫 API 並取得回應
  - 啟用失敗時顯示詳細錯誤訊息（如：類別載入失敗、路由註冊失敗）

#### FR-RF-003：停用 Restful Controller
- **描述**：系統應將啟用的 Controller 停用，卸載 API 路由
- **觸發者（Actor）**：開發人員、維運人員
- **前置條件**：Controller 存在且為啟用狀態
- **後置條件**：
  - Controller 狀態更新為 `is_active = false`
  - 從 `RequestMappingHandlerMapping` 卸載路由
  - 外部系統無法再存取該 API
- **輸入／輸出**：
  - 輸入：Controller ID
  - 輸出：停用成功／失敗訊息
- **業務規則**：
  - 停用不會刪除 Controller 記錄
  - 停用後可重新啟用
- **驗收標準**：
  - 停用成功後狀態顯示為「已停用」
  - 存取 API 時返回 404 錯誤
  - 停用失敗時顯示錯誤訊息

#### FR-RF-004：編輯 Restful Controller
- **描述**：系統應允許編輯已停用的 Controller 配置
- **觸發者（Actor）**：開發人員
- **前置條件**：
  - Controller 存在
  - Controller 為停用狀態
- **後置條件**：Controller 配置更新
- **輸入／輸出**：
  - 輸入：Controller ID、新的 Class Path / JAR File ID
  - 輸出：更新成功／失敗訊息
- **業務規則**：
  - 不可更改 Publish URI（若需更改，應刪除後重建）
- **驗收標準**：
  - 更新後資訊正確顯示
  - 重新啟用後使用新的配置

#### FR-RF-005：刪除 Restful Controller
- **描述**：系統應允許刪除已停用的 Controller
- **觸發者（Actor）**：開發人員
- **前置條件**：
  - Controller 存在
  - Controller 為停用狀態
- **後置條件**：
  - Controller 記錄從資料庫中移除
  - 若 JAR 檔案不再被其他 Endpoint/Restful 使用，狀態更新為 `UNUSED`
- **輸入／輸出**：
  - 輸入：Controller ID
  - 輸出：刪除成功／失敗訊息
- **業務規則**：
  - 啟用中的 Controller 不可刪除
  - 刪除前需顯示確認訊息
- **驗收標準**：
  - 成功刪除後記錄不再出現在清單中
  - 嘗試刪除啟用中的 Controller 時顯示錯誤訊息

#### FR-RF-006：查詢 Restful Controller 清單
- **描述**：系統應提供 Controller 清單查詢，顯示所有 Controller 配置與狀態
- **觸發者（Actor）**：開發人員、測試人員、維運人員
- **前置條件**：無
- **後置條件**：返回 Controller 清單
- **輸入／輸出**：
  - 輸入：無（或篩選條件：狀態、JAR 檔案）
  - 輸出：Controller ID、Publish URI、狀態、JAR 檔案名稱、建立時間
- **業務規則**：
  - 清單依建立時間倒序排列
  - 狀態以視覺化方式顯示
- **驗收標準**：
  - 可正確顯示所有 Controller
  - 篩選功能正常運作
  - 狀態正確顯示

---

### 3.4 Mock 回應管理模組

#### FR-MR-001：新增 Mock 回應規則
- **描述**：系統應允許建立 Mock 回應規則，根據條件返回預設回應
- **觸發者（Actor）**：測試人員、開發人員
- **前置條件**：對應的 Endpoint 或 Restful 已存在
- **後置條件**：
  - Mock Response 記錄儲存到 `mock_response` 表
  - 預設為啟用狀態（`is_active = true`）
- **輸入／輸出**：
  - 輸入：
    - Publish URI（如：`/ws/company` 或 `/api/company`）
    - Method（如：`getCompanyInfo`、`POST`、`GET`）
    - Condition（如：`companyId=001`、`default`）
    - Service Type（`ENDPOINT` 或 `RESTFUL`）
    - Response Content（XML 或 JSON 格式）
  - 輸出：建立成功／失敗訊息
- **業務規則**：
  - 複合主鍵（publish_uri, method, condition, service_type）不可重複
  - Response Content 必須是有效的 XML 或 JSON（根據 Service Type）
  - Condition 為 `default` 時作為預設回應（當其他條件不匹配時使用）
- **驗收標準**：
  - 成功新增後可在回應清單中看到該筆記錄
  - 重複的規則時顯示錯誤訊息
  - 無效的 XML/JSON 格式時顯示錯誤訊息

#### FR-MR-002：編輯 Mock 回應規則
- **描述**：系統應允許編輯既有的 Mock 回應規則
- **觸發者（Actor）**：測試人員、開發人員
- **前置條件**：Mock Response 記錄存在
- **後置條件**：Mock Response 內容更新
- **輸入／輸出**：
  - 輸入：
    - 主鍵（publish_uri, method, condition, service_type）
    - 新的 Response Content
  - 輸出：更新成功／失敗訊息
- **業務規則**：
  - 不可更改主鍵欄位（若需更改，應刪除後重建）
  - Response Content 必須是有效的 XML 或 JSON
- **驗收標準**：
  - 更新後內容正確顯示
  - 呼叫對應的 API/Web Service 時返回新的回應內容

#### FR-MR-003：刪除 Mock 回應規則
- **描述**：系統應允許刪除 Mock 回應規則
- **觸發者（Actor）**：測試人員、開發人員
- **前置條件**：Mock Response 記錄存在
- **後置條件**：Mock Response 記錄從資料庫中移除
- **輸入／輸出**：
  - 輸入：主鍵（publish_uri, method, condition, service_type）
  - 輸出：刪除成功／失敗訊息
- **業務規則**：刪除前需顯示確認訊息
- **驗收標準**：
  - 成功刪除後記錄不再出現在清單中
  - 呼叫對應的 API/Web Service 時不再匹配該規則

#### FR-MR-004：啟用／停用 Mock 回應規則
- **描述**：系統應允許切換 Mock 回應規則的啟用狀態
- **觸發者（Actor）**：測試人員、開發人員
- **前置條件**：Mock Response 記錄存在
- **後置條件**：`is_active` 狀態更新
- **輸入／輸出**：
  - 輸入：主鍵（publish_uri, method, condition, service_type）
  - 輸出：切換成功／失敗訊息
- **業務規則**：
  - 停用的規則不會被匹配
  - 啟用的規則優先於 `default` 規則
- **驗收標準**：
  - 停用後呼叫 API/Web Service 不會匹配該規則
  - 啟用後恢復匹配

#### FR-MR-005：查詢 Mock 回應清單
- **描述**：系統應提供 Mock 回應清單查詢，支援依 Publish URI 與 Service Type 篩選
- **觸發者（Actor）**：測試人員、開發人員
- **前置條件**：無
- **後置條件**：返回 Mock Response 清單
- **輸入／輸出**：
  - 輸入：篩選條件（Publish URI、Service Type）
  - 輸出：Publish URI、Method、Condition、Service Type、狀態、建立時間
- **業務規則**：
  - 清單依 Publish URI 與 Method 排序
  - Response Content 不在清單中顯示（僅在編輯時顯示）
- **驗收標準**：
  - 可正確顯示所有 Mock Response
  - 篩選功能正常運作
  - 狀態正確顯示

---

### 3.5 輔助工具模組

#### FR-TOOL-001：WSDL 轉 Java 物件
- **描述**：系統應提供 WSDL 轉 Java 工具，自動產生 Java 類別
- **觸發者（Actor）**：開發人員
- **前置條件**：使用者提供有效的 WSDL 檔案或 URL
- **後置條件**：產生 Java 類別（DTO、Service Interface）
- **輸入／輸出**：
  - 輸入：WSDL 檔案或 WSDL URL
  - 輸出：ZIP 壓縮檔（包含產生的 Java 原始碼）
- **業務規則**：
  - 使用 Apache CXF 的 `wsdl2java` 工具
  - 產生的類別包含：DTO、Service Interface、Exception 類別
  - 類別的 package 名稱可由使用者指定（<!-- TODO: 預設規則待定 -->）
- **驗收標準**：
  - 成功產生 ZIP 檔案並可下載
  - 產生的類別可正常編譯
  - 無效的 WSDL 時顯示錯誤訊息

---

## 4. 非功能性需求 (Non-Functional Requirements)

### 4.1 效能與容量

#### NFR-PERF-001：API 回應時間
- **描述**：API 請求的平均回應時間應小於 500ms（不含網路延遲）
- **量測條件**：
  - 測試環境：單機部署，CPU 4 核心，RAM 8GB
  - 測試負載：50 個並發請求
  - 測試場景：查詢 Endpoint/Restful 清單、呼叫 Mock 回應
- **驗收標準**：
  - 90% 的請求回應時間 < 500ms
  - 99% 的請求回應時間 < 1000ms

#### NFR-PERF-002：動態載入延遲
- **描述**：從 JAR 載入類別並發布服務的時間應小於 3 秒
- **量測條件**：
  - JAR 檔案大小 < 10MB
  - 包含的類別數量 < 50 個
- **驗收標準**：
  - 啟用 Endpoint/Restful 的操作在 3 秒內完成
  - 前端介面顯示載入進度指示器

#### NFR-PERF-003：並發請求支援
- **描述**：系統應支援至少 50 個並發 API 請求
- **量測條件**：
  - 測試環境：單機部署
  - 測試場景：多個 API 同時被呼叫
- **驗收標準**：
  - 50 個並發請求時，錯誤率 < 1%
  - 資料庫連線池不會耗盡

#### NFR-PERF-004：資料庫容量
- **描述**：系統應支援至少 100 個 JAR 檔案、500 個 Endpoint/Restful、1000 個 Mock Response
- **驗收標準**：
  - 資料庫檔案大小 < 5GB
  - 查詢效能不因資料量增加而顯著下降

### 4.2 可用性與可靠度

#### NFR-AVAIL-001：系統可用性
- **描述**：系統可用性應達到 99% 以上（每月停機時間 < 7.2 小時）
- **排除範圍**：計劃性維護時間不計入停機時間
- **驗收標準**：
  - 關鍵錯誤導致的停機時間 < 每月 7.2 小時
  - 系統提供健康檢查端點（<!-- TODO: 端點路徑待定 -->）

#### NFR-AVAIL-002：熱部署不影響現有服務
- **描述**：動態載入新的 Endpoint/Restful 時，不應影響已啟用的服務
- **驗收標準**：
  - 啟用新服務時，既有服務的回應時間不增加超過 10%
  - 既有服務的錯誤率不增加

#### NFR-AVAIL-003：錯誤恢復
- **描述**：系統應能從載入失敗中恢復，不影響整體穩定性
- **驗收標準**：
  - JAR 載入失敗時，記錄錯誤並回滾狀態，不導致系統崩潰
  - 使用者可重試失敗的操作

### 4.3 安全性與隱私

#### NFR-SEC-001：JAR 檔案安全性掃描
- **描述**：系統應對上傳的 JAR 檔案進行基本安全檢查
- **檢查項目**：
  - 檔案格式驗證（是否為有效的 ZIP 格式）
  - 檔案大小限制（最大 50MB）
  - <!-- TODO: 病毒掃描整合待評估（如：ClamAV） -->
- **驗收標準**：
  - 無效的 JAR 檔案無法上傳
  - 超過大小限制的檔案無法上傳

#### NFR-SEC-002：API 認證與授權
- **描述**：系統應提供 API 認證與授權機制（<!-- TODO: 具體方案待定 -->）
- **候選方案**：
  - HTTP Basic Authentication
  - JWT Token
  - API Key
- **驗收標準**：
  - 未認證的請求應返回 401 Unauthorized
  - 無權限的操作應返回 403 Forbidden

#### NFR-SEC-003：輸入驗證
- **描述**：所有使用者輸入應進行驗證，防止 SQL 注入與 XSS 攻擊
- **驗證項目**：
  - Publish URI 格式驗證（僅允許 `/` 與字母數字）
  - Class Path 格式驗證（僅允許 `.` 與字母）
  - Response Content 格式驗證（XML/JSON 格式檢查）
- **驗收標準**：
  - 惡意輸入被拒絕並記錄
  - 錯誤訊息不洩漏系統內部資訊

#### NFR-SEC-004：資料保護
- **描述**：敏感資料應加密儲存（<!-- TODO: 目前無敏感資料，未來若新增需評估 -->）
- **驗收標準**：
  - 資料庫連線密碼不以明文儲存
  - 日誌不包含敏感資訊

### 4.4 可維護性與可擴充性

#### NFR-MAINT-001：模組化架構
- **描述**：系統應採用分層架構，模組間低耦合
- **分層結構**：
  - Controller 層：處理 HTTP 請求
  - Service 層：業務邏輯
  - Repository 層：資料存取
  - Utility 層：工具類別
- **驗收標準**：
  - 每層職責明確，不跨層呼叫
  - 可獨立替換某層實作（如：更換資料庫）

#### NFR-MAINT-002：日誌與追蹤
- **描述**：系統應提供完整的日誌記錄與錯誤追蹤
- **日誌內容**：
  - API 請求／回應日誌（包含時間戳記、請求路徑、狀態碼）
  - 動態載入事件日誌（載入成功／失敗、類別名稱）
  - 錯誤日誌（Exception Stack Trace）
- **驗收標準**：
  - 日誌檔案以日期輪轉（每日一個檔案）
  - 日誌級別可調整（DEBUG / INFO / WARN / ERROR）
  - 提供日誌查詢介面（<!-- TODO: 待評估是否需要 -->）

#### NFR-MAINT-003：單元測試覆蓋率
- **描述**：關鍵業務邏輯的單元測試覆蓋率應達到 60% 以上
- **涵蓋範圍**：
  - Service 層業務邏輯
  - Utility 層工具類別
  - Repository 層資料存取（整合測試）
- **驗收標準**：
  - 使用 JaCoCo 工具量測覆蓋率
  - 關鍵功能（動態載入、Mock 回應匹配）覆蓋率 > 80%

#### NFR-MAINT-004：API 文件
- **描述**：系統應提供完整的 API 文件
- **文件內容**：
  - API 端點清單
  - Request / Response Schema
  - 錯誤碼說明
  - 範例請求
- **文件格式**：
  - Swagger / OpenAPI 3.0（<!-- TODO: 待整合 Springdoc -->）
  - 可透過瀏覽器存取（如：`/swagger-ui.html`）
- **驗收標準**：
  - 所有 API 端點都有文件
  - 文件與實際實作一致

### 4.5 使用性（Usability）與易用性

#### NFR-USAB-001：前端介面易用性
- **描述**：前端介面應簡潔易用，符合一般使用者習慣
- **設計原則**：
  - 使用 Material-UI 元件庫，保持一致的視覺風格
  - 操作流程不超過 3 步驟
  - 提供即時回饋（如：載入動畫、成功／錯誤提示）
- **驗收標準**：
  - 新使用者無需培訓即可完成基本操作（上傳 JAR、新增 Endpoint）
  - 錯誤訊息清晰易懂，提供解決建議

#### NFR-USAB-002：響應式設計
- **描述**：前端介面應支援常見螢幕解析度（<!-- TODO: 是否需要支援行動裝置待評估 -->）
- **支援解析度**：
  - 桌面：1920x1080、1366x768
  - <!-- TODO: 平板與手機支援待評估 -->
- **驗收標準**：
  - 在支援的解析度下，介面不會破版
  - 表格與表單可正常操作

#### NFR-USAB-003：瀏覽器相容性
- **描述**：前端介面應支援主流瀏覽器
- **支援瀏覽器**：
  - Chrome（最新版本）
  - Edge（最新版本）
  - Firefox（最新版本）
  - <!-- TODO: Safari 支援待評估 -->
- **驗收標準**：
  - 在支援的瀏覽器上，功能正常運作
  - UI 顯示一致

### 4.6 法規與合規要求（若適用）

#### NFR-COMP-001：開源授權合規
- **描述**：系統使用的開源套件應符合授權要求
- **授權類型**：
  - Apache License 2.0（Spring Boot、Apache CXF）
  - MIT License（React、Next.js）
- **驗收標準**：
  - 所有開源套件的授權已檢查
  - LICENSE 檔案包含所有引用的授權聲明

<!-- TODO: 其他法規要求（如：GDPR、個資法）待評估 -->

---

## 5. 外部介面需求

### 5.1 使用者介面概述（畫面類型、平台）

**平台**：Web 應用程式（桌面瀏覽器）

**主要畫面**：

| 畫面名稱 | 路徑 | 功能 |
|---------|------|------|
| Endpoint 管理 | `/endpoint` | 新增、編輯、刪除、啟用／停用 Endpoint |
| Restful 管理 | `/restful` | 新增、編輯、刪除、啟用／停用 Restful |
| Response 管理 | `/response` | 新增、編輯、刪除、啟用／停用 Mock Response |
| JAR 檔案管理 | 嵌入在 Endpoint/Restful 畫面中 | 上傳、查詢、刪除 JAR 檔案 |
| WSDL 工具 | 嵌入在 Endpoint 畫面中 | WSDL 轉 Java 物件 |

**UI 框架**：
- Next.js 15.5.4 + React 19
- Material-UI（MUI）元件庫
- TypeScript

### 5.2 系統介面（與其他系統／服務整合）

**外部系統呼叫動態載入的服務**：

| 介面類型 | 協定 | 說明 |
|---------|------|------|
| WSDL Web Service | SOAP over HTTP | 外部系統透過 WSDL 呼叫動態載入的 Web Service |
| RESTful API | HTTP/HTTPS | 外部系統透過 HTTP 方法（GET/POST/PUT/DELETE）呼叫 API |

**WSDL 存取範例**：
- URL：`http://localhost:8080/{publishUri}?wsdl`
- 協定：HTTP GET

**RESTful 存取範例**：
- URL：`http://localhost:8080/{publishUri}/{path}`
- 協定：HTTP GET/POST/PUT/DELETE

### 5.3 硬體介面（若有設備或感測器）

無硬體介面需求。

### 5.4 通訊介面（協定、埠號、訊息格式等）

#### 前後端通訊

- **協定**：HTTP/HTTPS
- **預設埠號**：
  - 後端（開發模式）：8080
  - 前端（開發模式）：3000
  - 後端（生產模式）：8080（前端靜態檔案嵌入）
- **資料格式**：JSON
- **認證方式**：<!-- TODO: 待定義 -->

#### 管理 API 端點

- **Base URL**（開發模式）：`http://localhost:8080/dynamic-api`
- **Base URL**（生產模式）：`http://localhost:8080/dynamic-api`

#### 動態載入的服務端點

- **Web Service Base URL**：`http://localhost:8080/{publishUri}`
- **RESTful Base URL**：`http://localhost:8080/{publishUri}`

#### 錯誤回應格式

```json
{
  "timestamp": "2026-01-02T10:30:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Publish URI already exists",
  "path": "/dynamic-api/ws/saveWebService"
}
```

---

## 6. 資料與業務規則概要

### 6.1 重要資料物件（如：使用者、訂單、案件、設備…）

| 資料物件 | 說明 |
|---------|------|
| **JAR File** | 上傳的 JAR 檔案，儲存二進制內容與狀態 |
| **Endpoint** | WSDL Web Service 端點配置 |
| **Controller** | RESTful API Controller 配置 |
| **Mock Response** | Mock 回應規則，根據條件匹配並返回回應 |

### 6.2 關鍵欄位與約束（唯一性、格式、生命週期）

#### JAR File
- **id**：主鍵，自動遞增
- **file_name**：檔案名稱，不可重複
- **file_content**：BLOB，儲存 JAR 二進制內容
- **status**：枚舉值（`UNUSED` / `INUSED`），預設 `UNUSED`
- **upload_time**：上傳時間，自動填入

#### Endpoint
- **id**：主鍵，自動遞增
- **publish_uri**：發布路徑，唯一，格式：`/開頭的路徑`
- **bean_name**：Spring Bean 名稱，唯一
- **class_path**：完整類別路徑，格式：`package.Class`
- **jar_file_id**：外鍵，關聯 JAR File
- **is_active**：布林值，預設 `false`

#### Controller
- **id**：主鍵,自動遞增
- **publish_uri**：發布路徑，唯一，格式：`/開頭的路徑`
- **class_path**：完整類別路徑，格式：`package.Class`
- **jar_file_id**：外鍵，關聯 JAR File
- **is_active**：布林值，預設 `false`

#### Mock Response
- **publish_uri**：主鍵之一，發布路徑
- **method**：主鍵之一，方法名稱或 HTTP Method
- **condition**：主鍵之一，條件（`default` 表示預設）
- **service_type**：主鍵之一，枚舉值（`ENDPOINT` / `RESTFUL`）
- **response_content**：TEXT，回應內容（XML 或 JSON）
- **is_active**：布林值，預設 `true`

### 6.3 共通業務規則（狀態流轉、時間限制、授權規則等）

#### JAR File 狀態流轉
```
UNUSED → (被 Endpoint/Restful 使用) → INUSED
INUSED → (所有使用者移除) → UNUSED
UNUSED → (刪除) → [已移除]
```

#### Endpoint/Controller 狀態流轉
```
停用 (is_active=false) → (啟用) → 啟用 (is_active=true)
啟用 (is_active=true) → (停用) → 停用 (is_active=false)
停用 (is_active=false) → (刪除) → [已移除]
```

#### Mock Response 匹配規則
1. 查詢條件：`publish_uri` + `method` + `condition` + `service_type`
2. 若找到且 `is_active = true`，返回 `response_content`
3. 若未找到，查詢 `condition = 'default'` 的規則
4. 若仍未找到，返回空回應或錯誤（<!-- TODO: 預設行為待定義 -->）

#### ClassLoader 隔離規則
- 每個 JAR 檔案使用獨立的 `DynamicClassLoader` 實例
- 不同 JAR 的類別不會互相影響
- JAR 卸載時，對應的 ClassLoader 應釋放（<!-- TODO: 目前實作需確認 GC 行為 -->）

---

## 7. 驗收與測試範圍

### 7.1 驗收準則（Go / No-Go 條件）

系統可被視為「可上線／可驗收」需滿足以下條件：

**功能驗收**：
- [ ] 所有 P0 功能需求完成且測試通過
- [ ] 至少 80% 的 P1 功能需求完成且測試通過
- [ ] 無 Critical / Blocker 等級的 Bug

**非功能驗收**：
- [ ] API 回應時間符合 NFR-PERF-001 標準
- [ ] 動態載入延遲符合 NFR-PERF-002 標準
- [ ] 並發測試通過 NFR-PERF-003 標準
- [ ] 單元測試覆蓋率 > 60%
- [ ] 無安全性漏洞（SQL 注入、XSS 測試通過）

**文件驗收**：
- [ ] API 文件完整且與實作一致
- [ ] 部署手冊完成
- [ ] 使用者操作手冊完成（<!-- TODO: 待撰寫 -->）

### 7.2 測試範圍與優先級（P0 / P1 / P2）

#### P0（最高優先級，必須測試）
- JAR 檔案上傳與儲存
- Endpoint 啟用與停用
- Restful 啟用與停用
- Mock 回應規則匹配與返回
- 動態載入的 Web Service 可正常呼叫
- 動態載入的 RESTful API 可正常呼叫

#### P1（次要優先級，應測試）
- JAR 檔案刪除（狀態 UNUSED）
- Endpoint/Restful 編輯
- Endpoint/Restful 刪除
- Mock 回應規則編輯與刪除
- WSDL 轉 Java 工具
- 錯誤處理（無效 JAR、無效 Class Path）

#### P2（低優先級，可選測試）
- 前端 UI 響應式設計
- 瀏覽器相容性測試
- 大量資料（100+ JAR 檔案）載入測試
- 長時間運行穩定性測試

---

## 8. 附錄

### 8.1 需求追蹤表（需求 ↔ 設計 ↔ 測試）

<!-- TODO: 待測試案例完成後補充 -->

| 需求編號 | 需求名稱 | 設計文件章節 | 測試案例編號 | 狀態 |
|---------|---------|-------------|------------|------|
| FR-JAR-001 | 上傳 JAR 檔案 | SDD 3.1 | TC-JAR-001 | 待開發 |
| FR-EP-001 | 新增 Endpoint | SDD 3.2 | TC-EP-001 | 待開發 |
| FR-RF-001 | 新增 Restful | SDD 3.3 | TC-RF-001 | 待開發 |
| FR-MR-001 | 新增 Mock 回應 | SDD 3.4 | TC-MR-001 | 待開發 |

### 8.2 變更紀錄

| 版本 | 日期 | 作者 | 變更摘要 |
|------|------|------|---------|
| 1.0.0 | 2026-01-02 | 開發團隊 | 初版完成 |

---

## SRS 寫作指引

- 每一條功能性需求須有明確、可驗證的驗收標準
- 編號穩定、具規則性，方便 Traceability
- 避免過早引入技術解法，維持「需求層級」描述
- 保持與利害關係人的溝通暢通，確保需求正確性
