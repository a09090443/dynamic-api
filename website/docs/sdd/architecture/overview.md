---
sidebar_position: 1
---

# 架構概覽

## 架構風格

Dynamic API Manager 採用 **前後端分離的分層架構**，結合 **插件式動態載入機制**。

### 後端分層架構

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
│          Utility 層                     │  ← 工具類別
└─────────────────────────────────────────┘
```

#### 層級職責

| 層級 | 職責 | 主要類別 |
|------|------|---------|
| **Controller** | 處理 HTTP 請求、參數驗證、回應格式化 | WebServiceController<br/>DynamicLoadController<br/>CommonController |
| **Service** | 業務邏輯、交易管理 | DynamicWebServiceImpl<br/>DynamicControllerServiceImpl<br/>CommonServiceImpl |
| **Repository** | 資料存取（JPA） | EndpointRepository<br/>ControllerRepository<br/>JarFileRepository |
| **JDBC** | 複雜查詢（JDBC） | EndpointJDBC<br/>MockResponseJDBC |
| **Utility** | 工具類別、動態載入 | DynamicClassLoader<br/>WebServiceHandler<br/>Wsdl2JavaUtil |

---

### 前端架構

```
┌─────────────────────────────────────────┐
│          Page Components                │  ← 頁面組件
├─────────────────────────────────────────┤
│          Feature Components             │  ← 功能組件
├─────────────────────────────────────────┤
│          Service 層                     │  ← API 呼叫封裝
├─────────────────────────────────────────┤
│          Types                          │  ← TypeScript 型別
└─────────────────────────────────────────┘
```

---

## 主要組成部分

| 組成部分 | 技術 | 職責 |
|---------|------|------|
| **前端介面** | Next.js 15 + React 19 + MUI | 提供管理介面（Endpoint、Restful、Response 管理） |
| **後端 API** | Spring Boot 3.2.5 + Spring MVC | 提供 RESTful API 給前端呼叫 |
| **動態載入引擎** | 自訂 DynamicClassLoader | 從 JAR 載入類別並發布服務 |
| **Web Service 發布** | Apache CXF 4.0 | 發布 WSDL Web Service |
| **RESTful 路由註冊** | Spring RequestMappingHandlerMapping | 動態註冊 RESTful Controller |
| **資料持久化** | Spring Data JPA + JDBC | 儲存 JAR、Endpoint、Controller、Mock Response |
| **資料庫** | SQLite 嵌入式資料庫 | 儲存所有配置與 JAR 二進制內容 |

---

## 整體互動關係圖

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

---

## 核心設計模式

### 1. 分層架構（Layered Architecture）

**優點**：
- 職責分離，易於維護
- 每層可獨立替換
- 易於測試（可Mock每層）

**實作**：
```java
// Controller 層
@RestController
@RequestMapping("/dynamic-api/ws")
public class WebServiceController {
    @Autowired
    private DynamicWebService dynamicWebService;  // 依賴 Service 層

    @GetMapping("/switchWebService")
    public ResponseEntity<?> switchWebService(@RequestParam Long id) {
        dynamicWebService.switchWebService(id);
        return ResponseEntity.ok().build();
    }
}

// Service 層
@Service
public class DynamicWebServiceImpl implements DynamicWebService {
    @Autowired
    private EndpointRepository endpointRepository;  // 依賴 Repository 層

    @Transactional
    public void switchWebService(Long id) {
        // 業務邏輯
    }
}
```

---

### 2. 依賴注入（Dependency Injection）

使用 Spring IoC 容器管理物件生命週期。

```java
@Service
public class DynamicWebServiceImpl {
    private final EndpointRepository endpointRepository;
    private final JarFileRepository jarFileRepository;
    private final WebServiceHandler webServiceHandler;

    // 建構子注入（推薦方式）
    @Autowired
    public DynamicWebServiceImpl(
        EndpointRepository endpointRepository,
        JarFileRepository jarFileRepository,
        WebServiceHandler webServiceHandler
    ) {
        this.endpointRepository = endpointRepository;
        this.jarFileRepository = jarFileRepository;
        this.webServiceHandler = webServiceHandler;
    }
}
```

---

### 3. 策略模式（Strategy Pattern）

用於 ClassLoader 隔離機制。

```java
// 策略介面
public interface ClassLoaderStrategy {
    Class<?> loadClass(byte[] jarBytes, String className) throws Exception;
}

// 具體策略
public class DynamicClassLoaderStrategy implements ClassLoaderStrategy {
    @Override
    public Class<?> loadClass(byte[] jarBytes, String className) throws Exception {
        DynamicClassLoader classLoader = new DynamicClassLoader(jarBytes);
        return classLoader.loadClass(className);
    }
}
```

---

### 4. 單例模式（Singleton Pattern）

用於管理多個 ClassLoader 實例。

```java
public enum ClassLoaderSingletonEnum {
    INSTANCE;

    private final Map<String, DynamicClassLoader> classLoaders = new ConcurrentHashMap<>();

    public void put(String key, DynamicClassLoader classLoader) {
        classLoaders.put(key, classLoader);
    }

    public DynamicClassLoader get(String key) {
        return classLoaders.get(key);
    }
}
```

---

### 5. 模板方法模式（Template Method Pattern）

用於 base-jar 的 `WebserviceBase` 與 `RestfulBase`。

```java
public abstract class WebserviceBase {
    @Autowired
    private MockResponseDao mockResponseDao;

    // 模板方法
    protected <T> T findByPrimaryKey(String publishUri, String method, String condition, Class<T> clazz) {
        // 1. 精確匹配
        T response = mockResponseDao.findByPrimaryKey(publishUri, method, condition, ServiceType.ENDPOINT, clazz);
        if (response != null) {
            return response;
        }

        // 2. 預設匹配
        return mockResponseDao.findByPrimaryKey(publishUri, method, "default", ServiceType.ENDPOINT, clazz);
    }
}
```

---

## 技術選型理由

| 技術 | 選擇理由 | 替代方案 |
|------|---------|---------|
| **Spring Boot** | 快速開發、自動配置、生態成熟 | Quarkus、Micronaut |
| **SQLite** | 嵌入式、無需獨立伺服器、單一檔案部署 | H2、PostgreSQL |
| **Next.js** | SSR/SSG 支援、生態成熟、易於部署 | Nuxt.js、Gatsby |
| **Apache CXF** | JAX-WS 標準實作、成熟穩定 | Metro、Axis2 |
| **Material-UI** | 元件豐富、符合 Material Design | Ant Design、Chakra UI |

---

## 相關文件

- [模組設計](../modules/overview) - 模組化架構說明
- [資料設計](../database/erd) - 資料庫架構
- [部署概述](../deployment/overview) - 部署策略
