---
sidebar_position: 2
---

# 6.2 Endpoint 動態載入流程

WSDL Web Service 的完整動態載入與發布流程。

## 流程概述

本流程說明如何從使用者點擊「啟用」按鈕開始，到 Web Service 成功發布並可供外部系統呼叫的完整過程。

## 參與者（Actor）

| 參與者 | 職責 |
|--------|------|
| **使用者** | 透過前端介面操作 |
| **前端應用** | Next.js 管理介面 |
| **WebServiceController** | 處理 HTTP 請求 |
| **DynamicWebServiceImpl** | 實作動態載入邏輯 |
| **EndpointRepository** | Endpoint 資料存取 |
| **JarFileRepository** | JAR 檔案資料存取 |
| **DynamicClassLoader** | 動態類別載入器 |
| **WebServiceHandler** | Web Service 發布管理器 |
| **Apache CXF** | Web Service 引擎 |
| **SQLite 資料庫** | 資料持久化 |

## 完整序列圖

```mermaid
sequenceDiagram
    actor User as 使用者
    participant Frontend as 前端應用
    participant Controller as WebServiceController
    participant Service as DynamicWebServiceImpl
    participant EndpointRepo as EndpointRepository
    participant JarRepo as JarFileRepository
    participant ClassLoader as DynamicClassLoader
    participant Handler as WebServiceHandler
    participant CXF as Apache CXF
    participant DB as SQLite Database

    User->>Frontend: 點擊「啟用」按鈕
    Frontend->>Controller: GET /dynamic-api/ws/switchWebService?id=1
    
    Controller->>Service: switchWebService(1)
    
    Service->>EndpointRepo: findById(1)
    EndpointRepo->>DB: SELECT * FROM endpoint WHERE id=1
    DB-->>EndpointRepo: Endpoint 資料
    EndpointRepo-->>Service: Endpoint 實體
    
    Service->>Service: 檢查 is_active 狀態
    
    alt 若為停用狀態（啟用邏輯）
        Service->>JarRepo: findById(jarFileId)
        JarRepo->>DB: SELECT file_content FROM jar_file WHERE id=?
        DB-->>JarRepo: JAR BLOB
        JarRepo-->>Service: JAR 檔案內容
        
        Service->>ClassLoader: new DynamicClassLoader(jarBytes)
        ClassLoader-->>Service: ClassLoader 實例
        
        Service->>ClassLoader: Class.forName(classPath)
        ClassLoader->>ClassLoader: 從 JAR 載入類別
        ClassLoader-->>Service: Class 物件
        
        Service->>Service: clazz.newInstance()
        Service-->>Service: 服務實例
        
        Service->>Handler: publish(publishUri, instance)
        Handler->>CXF: Endpoint.publish(uri, instance)
        CXF-->>Handler: 發布成功
        Handler-->>Service: 發布成功
        
        Service->>EndpointRepo: save(endpoint with is_active=true)
        EndpointRepo->>DB: UPDATE endpoint SET is_active=true WHERE id=1
        DB-->>EndpointRepo: 更新成功
        EndpointRepo-->>Service: 儲存成功
        
        Service->>JarRepo: updateStatus(jarFileId, INUSED)
        JarRepo->>DB: UPDATE jar_file SET status='INUSED' WHERE id=?
        DB-->>JarRepo: 更新成功
        JarRepo-->>Service: 更新成功
        
    else 若為啟用狀態（停用邏輯）
        Service->>Handler: stop(publishUri)
        Handler->>CXF: endpoint.stop()
        CXF-->>Handler: 停止成功
        Handler-->>Service: 停止成功
        
        Service->>EndpointRepo: save(endpoint with is_active=false)
        EndpointRepo->>DB: UPDATE endpoint SET is_active=false WHERE id=1
        DB-->>EndpointRepo: 更新成功
        EndpointRepo-->>Service: 儲存成功
        
        Service->>Service: 檢查 JAR 是否被其他服務使用
        Service->>JarRepo: updateStatusIfUnused(jarFileId)
        JarRepo->>DB: UPDATE jar_file SET status='UNUSED' WHERE id=? AND ...
        DB-->>JarRepo: 更新成功
        JarRepo-->>Service: 更新成功
    end
    
    Service-->>Controller: 返回成功訊息
    Controller-->>Frontend: HTTP 200 OK + JSON
    Frontend-->>User: 顯示「啟用成功」
    User->>User: 可透過 WSDL 存取服務
```

## 詳細步驟說明

### 步驟 1-3：請求接收
1. 使用者在前端點擊「啟用」按鈕
2. 前端呼叫 `GET /dynamic-api/ws/switchWebService?id=1`
3. `WebServiceController` 接收請求，呼叫 `DynamicWebServiceImpl.switchWebService(1)`

### 步驟 4-6：查詢 Endpoint
4. `DynamicWebServiceImpl` 查詢 Endpoint 實體（id=1）
5. 從資料庫取得 Endpoint 資料
6. 檢查 `is_active` 狀態

### 步驟 7-12：載入 JAR 與類別（若為停用）
7. 查詢關聯的 JAR 檔案（透過 `jar_file_id`）
8. 從資料庫讀取 `jar_file.file_content`（BLOB）
9. 建立 `DynamicClassLoader` 實例，傳入 JAR 二進制內容
10. 使用 `Class.forName(classPath, true, classLoader)` 載入類別
11. 使用 `clazz.getDeclaredConstructor().newInstance()` 實例化
12. 得到服務實例

### 步驟 13-15：發布 Web Service
13. 呼叫 `WebServiceHandler.publish(publishUri, serviceInstance)`
14. `WebServiceHandler` 內部呼叫 `Endpoint.publish(publishUri, serviceInstance)`（Apache CXF）
15. Web Service 發布成功

### 步驟 16-19：更新狀態
16. 更新 `endpoint.is_active = true`
17. 儲存到資料庫
18. 更新 `jar_file.status = INUSED`
19. 返回成功訊息給前端

### 步驟 20：完成
20. 前端更新狀態顯示為「已啟用」

## 異常處理流程

```mermaid
graph TD
    A[開始載入] --> B{JAR 檔案存在?}
    B -->|否| C[返回錯誤：JAR 檔案不存在]
    B -->|是| D{類別載入成功?}
    D -->|否| E[返回錯誤：ClassNotFoundException]
    D -->|是| F{實例化成功?}
    F -->|否| G[返回錯誤：InstantiationException]
    F -->|是| H{CXF 發布成功?}
    H -->|否| I[回滾狀態變更]
    I --> J[返回錯誤：發布失敗]
    H -->|是| K[更新狀態]
    K --> L[返回成功]
    
    style C fill:#ffcccc
    style E fill:#ffcccc
    style G fill:#ffcccc
    style I fill:#ffcccc
    style J fill:#ffcccc
    style L fill:#ccffcc
```

### 異常處理策略

| 異常類型 | 處理方式 |
|---------|---------|
| **JAR 檔案不存在** | 返回錯誤訊息，不執行後續步驟 |
| **ClassNotFoundException** | 記錄錯誤日誌，返回「類別載入失敗」訊息 |
| **InstantiationException** | 記錄錯誤日誌，返回「實例化失敗」訊息 |
| **CXF 發布失敗** | 回滾狀態變更，返回「發布失敗」訊息 |
| **資料庫錯誤** | 使用事務回滾，返回「系統錯誤」訊息 |

:::danger 重要注意事項
所有狀態更新必須在事務中執行，確保失敗時可以完整回滾。
:::

## 關鍵技術細節

### ClassLoader 建立

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

### Web Service 發布

```java
// 使用 Apache CXF 發布
javax.xml.ws.Endpoint endpoint = javax.xml.ws.Endpoint.publish(publishUri, serviceInstance);

// 儲存 Endpoint 實例供停用時使用
endpointMap.put(publishUri, endpoint);
```

## 效能考量

| 項目 | 預期時間 | 優化建議 |
|------|---------|---------|
| JAR BLOB 讀取 | < 500ms | 考慮加入快取機制 |
| 類別載入 | < 1s | 確保 JAR 大小 < 10MB |
| CXF 發布 | < 1s | Apache CXF 內部優化 |
| **總計** | **< 3s** | 滿足 NFR-PERF-002 要求 |

:::tip 效能優化建議
若 JAR 檔案較大（> 10MB），建議實作快取機制，避免重複從資料庫讀取 BLOB。
:::

## 相關文件

- [3.3 Endpoint 管理模組](../modules/endpoint-module)
