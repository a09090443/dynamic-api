---
id: workflows
title: 6. 業務流程與演算法設計
description: '新增並啟用、編輯、刪除服務、系統啟動恢復與執行期請求處理的流程，以及 RESTful 路徑驗證與日誌末尾讀取演算法。'
sidebar_label: 6. 業務流程
---

# 6. 業務流程與演算法設計

## 6.1 新增並啟用 Endpoint

```mermaid
sequenceDiagram
    autonumber
    actor U as 使用者
    participant FE as 管理介面
    participant CC as CommonController
    participant WC as WebServiceController
    participant WS as DynamicWebServiceImpl
    participant H as WebServiceHandler
    participant DB as SQLite
    participant FS as jar.file.dir

    U->>FE: 填表並選擇 JAR，按儲存
    FE->>CC: POST /common/uploadJarFile
    CC->>FS: 寫入 {UUID}.jar
    CC->>DB: INSERT JAR_FILE (STATUS=I)
    CC-->>FE: jarFileId
    FE->>WC: POST /ws/saveWebService
    WC->>WS: saveWebService(dto)
    WS->>DB: UPDATE JAR_FILE STATUS=A
    WS->>DB: INSERT ENDPOINT (IS_ACTIVE=0)
    WC-->>FE: EndpointResponseDTO
    U->>FE: 打開開關（確認）
    FE->>WC: GET /ws/switchWebService?isActive=true
    WC->>WS: enabledWebService(publishUri)
    WS->>H: registerWebService(...)
    H-->>WS: 發布完成
    WS->>DB: UPDATE ENDPOINT IS_ACTIVE=1
    WC-->>FE: 成功
```

RESTful 的流程相同，第 13 步改為 `DynamicControllerServiceImpl.startUpControllerProcess`。

## 6.2 編輯服務

以 Endpoint 為例（RESTful 相同，僅多一步 JAR→`I`）：

```mermaid
flowchart TD
    A[POST /ws/updateWebService] --> B{必填欄位齊全?}
    B -- 否 --> X[code=400]
    B -- 是 --> C[getEndpoint by id 取得原設定]
    C --> D[disabledWebService 原設定<br/>撤銷 CXF、關閉 ClassLoader]
    D --> E[saveWebService 新設定<br/>IS_ACTIVE=0、新 JAR→A]
    E --> F[原 JAR → I]
    F --> G{publishUri 變更?}
    G -- 是 --> H[刪除舊 URI 設定<br/>原 JAR → D 並刪檔]
    H --> I[MOCK_RESPONSE 舊 URI → 新 URI]
    G -- 否 --> J
    I --> J{jarFileId 變更?}
    J -- 是 --> K[原 JAR → D 並刪檔]
    J -- 否 --> L[回傳新設定]
    K --> L
```

步驟 H 不檢查新設定是否仍引用原 JAR，是 KI-02 的成因。

## 6.3 刪除服務

```mermaid
flowchart LR
    A[DELETE removeWebService<br/>publishUri 陣列] --> B[逐一 getEndpoint]
    B --> C[disabledWebService]
    C --> D[deleteById publishUri]
    D --> E[JAR → D，刪除實體檔]
```

## 6.4 系統啟動恢復

```mermaid
sequenceDiagram
    autonumber
    participant SB as Spring Boot
    participant FW as Flyway
    participant SW as SetupWebservices
    participant SC as SetupController
    participant DB as SQLite

    SB->>FW: 執行遷移
    SB->>SB: 建立 Bean、啟動內嵌 Tomcat
    SB->>SW: SmartLifecycle.start()
    SW->>DB: findAllByIsActive(true)（ENDPOINT）
    loop 每個 Endpoint
        SW->>SW: registerWebService
        alt 失敗
            SW->>DB: IS_ACTIVE=0
        end
    end
    SB->>SC: SmartLifecycle.start()
    SC->>DB: findAllByIsActive(true)（CONTROLLER）
    loop 每個 Controller
        SC->>SC: startUpControllerProcess
        alt 失敗
            SC->>DB: IS_ACTIVE=0
        end
    end
```

## 6.5 執行期請求處理

### SOAP

```mermaid
sequenceDiagram
    autonumber
    participant C as 呼叫端
    participant CXF as CXFServlet (/webservice/*)
    participant IN as CdataContentInterceptor（選用）
    participant I as 使用者實作類別
    participant D as MockResponseDao
    participant OUT as ResponseCdataInterceptor（選用）
    C->>CXF: POST /dynamic-api/webservice/company
    CXF->>IN: RECEIVE：還原被跳脫的角括號
    CXF->>I: getCompany(request)（JAXB 反序列化）
    I->>D: findByPrimaryKey(...)
    D-->>I: SOAP XML 字串
    I-->>CXF: CompanyResponse
    CXF->>OUT: PRE_STREAM：還原跳脫字元
    CXF-->>C: SOAP Response
```

### REST

`DispatcherServlet` → `RequestMappingHandlerMapping`（含動態註冊的對應）→ 使用者 Controller 方法 → `findByPrimaryKey` → 回傳值經 `@ResponseResultBody` 包裝（若有標註）。

## 6.6 核心演算法

### RESTful 路徑驗證

```java
String routePath = classRequestMapping != null ? classRequestMapping.value()[0] : "";
if (StringUtils.isNotBlank(routePath) && !routePath.split("/")[1].equals(publishUri)) {
    throw new ControllerException("Controller 註冊服務失敗，路徑不一致");
}
```

- 類別沒有 `@RequestMapping` 時不驗證（路由直接使用方法路徑，可能與 Publish URI 無關）。
- `routePath` 必須以 `/` 開頭，否則 `split("/")[1]` 會取到第二段或越界。

### 日誌末尾讀取

`getLastNLines` 以 `RandomAccessFile` 從檔尾逐位元組往前讀，遇到 `\n` 即完成一行；每行以 ISO-8859-1 取回位元組再以 UTF-8 解碼，以正確處理中文。
