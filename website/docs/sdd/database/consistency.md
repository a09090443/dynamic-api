---
sidebar_position: 3
---

# 資料一致性策略

本章節描述系統如何確保資料的一致性與完整性。

---

## 交易管理

### Spring @Transactional

所有寫入操作使用 Spring `@Transactional` 註解確保 ACID 特性。

#### 配置

```java
@Service
@Transactional  // 類別層級：所有方法預設使用交易
public class DynamicWebServiceImpl implements DynamicWebService {

    @Transactional(rollbackFor = Exception.class)  // 方法層級：明確指定回滾條件
    public void switchWebService(Long endpointId) throws Exception {
        // 業務邏輯
    }
}
```

#### 交易隔離級別

```java
@Transactional(isolation = Isolation.READ_COMMITTED)
```

| 隔離級別 | 說明 | 適用場景 |
|---------|------|---------|
| `READ_UNCOMMITTED` | 未提交讀 | ❌ 不使用（會產生髒讀） |
| `READ_COMMITTED` | 已提交讀 | ✅ **預設使用**（SQLite 預設） |
| `REPEATABLE_READ` | 可重複讀 | ⚠️ SQLite 不支援 |
| `SERIALIZABLE` | 序列化 | ⚠️ 效能低，僅在必要時使用 |

---

## 關鍵交易場景

### 場景 1：啟用 Endpoint

**業務需求**：
- 更新 Endpoint.is_active = true
- 更新 JAR_FILE.status = INUSED
- 若任一操作失敗，全部回滾

**實作**：

```java
@Transactional(rollbackFor = Exception.class)
public void switchWebService(Long endpointId) throws Exception {
    // 1. 查詢 Endpoint
    Endpoint endpoint = endpointRepository.findById(endpointId)
        .orElseThrow(() -> new EndpointNotFoundException("Endpoint 不存在"));

    // 2. 檢查目前狀態
    boolean currentActive = endpoint.getIsActive();

    if (!currentActive) {
        // 啟用邏輯

        // 3. 查詢關聯的 JAR 檔案
        JarFile jarFile = jarFileRepository.findById(endpoint.getJarFileId())
            .orElseThrow(() -> new JarFileNotFoundException("JAR 檔案不存在"));

        // 4. 從 JAR 載入類別（若失敗會拋出異常，觸發回滾）
        Class<?> clazz = loadClassFromJar(jarFile, endpoint.getClassPath());
        Object instance = clazz.getDeclaredConstructor().newInstance();

        // 5. 發布 Web Service（若失敗會拋出異常，觸發回滾）
        webServiceHandler.publish(endpoint.getPublishUri(), instance);

        // 6. 更新 Endpoint 狀態
        endpoint.setIsActive(true);
        endpointRepository.save(endpoint);

        // 7. 更新 JAR 檔案狀態
        jarFile.setStatus(JarFileStatus.INUSED);
        jarFileRepository.save(jarFile);

        // 交易成功提交
    } else {
        // 停用邏輯
        // ...
    }
}
```

**錯誤處理**：

```java
try {
    switchWebService(endpointId);
} catch (ClassNotFoundException e) {
    // 類別載入失敗，交易已自動回滾
    log.error("類別載入失敗", e);
    throw new LoadFailedException("類別不存在於 JAR 中");
} catch (Exception e) {
    // 其他異常，交易已自動回滾
    log.error("啟用 Endpoint 失敗", e);
    throw new PublishFailedException("服務發布失敗");
}
```

---

### 場景 2：刪除 JAR 檔案

**業務需求**：
- 檢查 JAR 是否被 Endpoint/Controller 使用
- 若被使用，拋出異常阻止刪除
- 若未使用，刪除 JAR 記錄

**實作**：

```java
@Transactional(rollbackFor = Exception.class)
public void deleteJarFile(Long jarFileId) throws Exception {
    // 1. 查詢 JAR 檔案
    JarFile jarFile = jarFileRepository.findById(jarFileId)
        .orElseThrow(() -> new JarFileNotFoundException("JAR 檔案不存在"));

    // 2. 檢查狀態
    if (JarFileStatus.INUSED.equals(jarFile.getStatus())) {
        throw new JarInUseException("JAR 檔案使用中，無法刪除");
    }

    // 3. 雙重檢查（確保沒有 Endpoint/Controller 關聯）
    long endpointCount = endpointRepository.countByJarFileId(jarFileId);
    long controllerCount = controllerRepository.countByJarFileId(jarFileId);

    if (endpointCount > 0 || controllerCount > 0) {
        // 發現不一致，更新狀態
        jarFile.setStatus(JarFileStatus.INUSED);
        jarFileRepository.save(jarFile);
        throw new JarInUseException("JAR 檔案使用中，無法刪除");
    }

    // 4. 刪除 JAR 檔案
    jarFileRepository.delete(jarFile);

    // 交易成功提交
}
```

---

### 場景 3：刪除 Endpoint

**業務需求**：
- 刪除 Endpoint 記錄
- 檢查 JAR 是否還被其他 Endpoint/Controller 使用
- 若否，更新 JAR_FILE.status = UNUSED

**實作**：

```java
@Transactional(rollbackFor = Exception.class)
public void removeWebService(Long endpointId) throws Exception {
    // 1. 查詢 Endpoint
    Endpoint endpoint = endpointRepository.findById(endpointId)
        .orElseThrow(() -> new EndpointNotFoundException("Endpoint 不存在"));

    // 2. 檢查是否已停用
    if (endpoint.getIsActive()) {
        throw new EndpointActiveException("Endpoint 啟用中，請先停用後再刪除");
    }

    // 3. 記錄 JAR File ID（刪除前需要）
    Long jarFileId = endpoint.getJarFileId();

    // 4. 刪除 Endpoint
    endpointRepository.delete(endpoint);

    // 5. 檢查 JAR 是否還被其他服務使用
    long endpointCount = endpointRepository.countByJarFileId(jarFileId);
    long controllerCount = controllerRepository.countByJarFileId(jarFileId);

    // 6. 若無其他服務使用，更新 JAR 狀態
    if (endpointCount == 0 && controllerCount == 0) {
        JarFile jarFile = jarFileRepository.findById(jarFileId).orElse(null);
        if (jarFile != null) {
            jarFile.setStatus(JarFileStatus.UNUSED);
            jarFileRepository.save(jarFile);
        }
    }

    // 交易成功提交
}
```

---

## 並發控制

### 樂觀鎖定（Optimistic Locking）

使用 JPA `@Version` 註解實現樂觀鎖定：

```java
@Entity
@Table(name = "endpoint")
public class Endpoint {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Version  // JPA 樂觀鎖定
    private Long version;

    // 其他欄位...
}
```

**運作原理**：

1. 讀取 Endpoint 時，同時讀取 `version` 欄位
2. 更新時，WHERE 條件包含 `version`：
   ```sql
   UPDATE endpoint
   SET publish_uri = ?, version = version + 1
   WHERE id = ? AND version = ?
   ```
3. 若 `version` 不匹配（被其他交易更新），拋出 `OptimisticLockException`

**處理衝突**：

```java
try {
    endpointRepository.save(endpoint);
} catch (OptimisticLockException e) {
    // 樂觀鎖定衝突，資料已被其他交易更新
    log.warn("Endpoint 已被其他使用者更新", e);
    throw new ConcurrentUpdateException("資料已被更新，請重新載入後再試");
}
```

---

### 悲觀鎖定（Pessimistic Locking）

SQLite 寫入時自動使用資料庫級鎖定，通常不需要額外處理。

若需要明確鎖定：

```java
@Lock(LockModeType.PESSIMISTIC_WRITE)
@Query("SELECT e FROM Endpoint e WHERE e.id = :id")
Optional<Endpoint> findByIdWithLock(@Param("id") Long id);
```

**注意**：SQLite 並發寫入能力有限，過度使用悲觀鎖定可能降低效能。

---

## 資料一致性檢查

### 啟動時一致性檢查

應用程式啟動時執行一致性檢查，確保資料狀態正確：

```java
@Component
public class DataConsistencyChecker implements CommandLineRunner {

    @Autowired
    private JarFileRepository jarFileRepository;

    @Autowired
    private EndpointRepository endpointRepository;

    @Autowired
    private ControllerRepository controllerRepository;

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        log.info("執行資料一致性檢查...");

        // 1. 檢查 JAR 檔案狀態
        List<JarFile> jarFiles = jarFileRepository.findAll();
        for (JarFile jarFile : jarFiles) {
            long usageCount = endpointRepository.countByJarFileId(jarFile.getId())
                            + controllerRepository.countByJarFileId(jarFile.getId());

            JarFileStatus expectedStatus = (usageCount > 0)
                ? JarFileStatus.INUSED
                : JarFileStatus.UNUSED;

            if (!expectedStatus.equals(jarFile.getStatus())) {
                log.warn("JAR 檔案狀態不一致：ID={}, 期望={}, 實際={}",
                    jarFile.getId(), expectedStatus, jarFile.getStatus());

                // 自動修正
                jarFile.setStatus(expectedStatus);
                jarFileRepository.save(jarFile);

                log.info("已修正 JAR 檔案狀態：ID={}", jarFile.getId());
            }
        }

        // 2. 檢查啟用狀態與實際載入狀態
        List<Endpoint> activeEndpoints = endpointRepository.findByIsActive(true);
        for (Endpoint endpoint : activeEndpoints) {
            boolean actuallyLoaded = webServiceHandler.isPublished(endpoint.getPublishUri());
            if (!actuallyLoaded) {
                log.warn("Endpoint 狀態不一致：ID={}, is_active=true 但未實際載入",
                    endpoint.getId());

                // 可選：自動重新載入或標記為停用
                endpoint.setIsActive(false);
                endpointRepository.save(endpoint);

                log.info("已修正 Endpoint 狀態：ID={}", endpoint.getId());
            }
        }

        log.info("資料一致性檢查完成");
    }
}
```

---

### 定期一致性檢查（可選）

使用 Spring `@Scheduled` 定期執行一致性檢查：

```java
@Component
public class ScheduledConsistencyChecker {

    // 每小時執行一次
    @Scheduled(cron = "0 0 * * * ?")
    @Transactional
    public void checkConsistency() {
        log.info("執行定期一致性檢查...");

        // 檢查邏輯（同上）

        log.info("定期一致性檢查完成");
    }
}
```

---

## 資料完整性約束

### 外鍵約束

```sql
FOREIGN KEY (jar_file_id) REFERENCES jar_file(id)
    ON DELETE RESTRICT  -- 禁止刪除使用中的 JAR
    ON UPDATE CASCADE   -- JAR ID 更新時自動同步
```

**ON DELETE RESTRICT**：
- 若嘗試刪除被引用的 JAR 檔案，資料庫會拋出錯誤
- 應用程式需先刪除所有關聯的 Endpoint/Controller

**ON UPDATE CASCADE**：
- 若 JAR 檔案的 ID 更新（不太可能發生），自動更新所有關聯記錄

---

### 唯一約束

```sql
-- Endpoint 的 publish_uri 不可重複
CREATE UNIQUE INDEX idx_endpoint_publish_uri ON endpoint(publish_uri);

-- Endpoint 的 bean_name 不可重複
CREATE UNIQUE INDEX idx_endpoint_bean_name ON endpoint(bean_name);

-- JAR 檔案的 file_name 不可重複
CREATE UNIQUE INDEX idx_jar_file_name ON jar_file(file_name);
```

**應用層檢查**：

```java
// 新增 Endpoint 前檢查
if (endpointRepository.existsByPublishUri(publishUri)) {
    throw new PublishUriExistsException("Publish URI 已存在");
}

if (endpointRepository.existsByBeanName(beanName)) {
    throw new BeanNameExistsException("Bean Name 已存在");
}
```

---

## 錯誤恢復策略

### 交易回滾

```java
@Transactional(rollbackFor = Exception.class)
public void switchWebService(Long endpointId) throws Exception {
    try {
        // 業務邏輯
        // ...
    } catch (ClassNotFoundException e) {
        // 異常會自動觸發回滾
        log.error("類別載入失敗，交易回滾", e);
        throw new LoadFailedException("類別不存在於 JAR 中");
    } catch (Exception e) {
        // 所有異常都觸發回滾
        log.error("操作失敗，交易回滾", e);
        throw e;
    }
}
```

### 手動回滾

```java
@Transactional
public void complexOperation() {
    try {
        // 步驟 1
        performStep1();

        // 步驟 2
        performStep2();

        // 步驟 3
        if (someCondition) {
            // 手動標記回滾
            TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
            return;
        }

        // 步驟 4
        performStep4();

    } catch (Exception e) {
        // 異常會自動觸發回滾
        throw e;
    }
}
```

---

## 資料一致性最佳實踐

### 1. 使用交易包裹關鍵操作

```java
// ✅ 正確：使用交易
@Transactional
public void updateMultipleTables() {
    updateTable1();
    updateTable2();
}

// ❌ 錯誤：無交易，可能導致不一致
public void updateMultipleTables() {
    updateTable1();  // 成功
    updateTable2();  // 失敗 → table1 已更新但 table2 未更新
}
```

---

### 2. 明確指定回滾條件

```java
// ✅ 正確：所有異常都回滾
@Transactional(rollbackFor = Exception.class)
public void criticalOperation() { }

// ⚠️ 預設：僅 RuntimeException 會回滾
@Transactional
public void operation() { }
```

---

### 3. 避免長交易

```java
// ❌ 錯誤：交易時間過長
@Transactional
public void longRunningOperation() {
    queryDatabase();         // 快
    processData();           // 慢（可能數分鐘）
    updateDatabase();        // 快
}

// ✅ 正確：僅關鍵部分使用交易
public void longRunningOperation() {
    Data data = queryDatabase();  // 無交易
    Data result = processData(data);  // 無交易
    saveResult(result);  // 交易
}

@Transactional
private void saveResult(Data result) {
    updateDatabase(result);
}
```

---

### 4. 使用唯一約束防止重複

```java
// ✅ 正確：依賴資料庫唯一約束
try {
    jarFileRepository.save(jarFile);
} catch (DataIntegrityViolationException e) {
    throw new FileNameExistsException("檔案名稱已存在");
}

// ❌ 錯誤：應用層檢查可能有競爭條件
if (!jarFileRepository.existsByFileName(fileName)) {
    // 另一個交易可能在這之間插入同名檔案
    jarFileRepository.save(jarFile);
}
```

---

## 監控與追蹤

### 交易監控

使用 Spring Boot Actuator 監控交易狀態：

```yaml
management:
  endpoints:
    web:
      exposure:
        include: metrics
  metrics:
    enable:
      jpa: true
```

**監控指標**：
- `hikari.connections.active`：活躍連線數
- `jpa.transactions.count`：交易總數
- `jpa.transactions.rollback`：回滾次數

### 日誌追蹤

```java
@Transactional
public void switchWebService(Long endpointId) throws Exception {
    log.info("開始交易：啟用 Endpoint，ID={}", endpointId);

    try {
        // 業務邏輯
        // ...

        log.info("交易成功：Endpoint 已啟用，ID={}", endpointId);
    } catch (Exception e) {
        log.error("交易失敗：Endpoint 啟用失敗，ID={}, 錯誤={}",
            endpointId, e.getMessage(), e);
        throw e;
    }
}
```

---

## 相關文件

- [概念資料模型（ERD）](./erd) - 實體關係與約束
- [資料表 Schema](./schema) - 詳細欄位定義與 DDL
- [模組設計](../modules/jar-module) - JAR 檔案管理業務邏輯
