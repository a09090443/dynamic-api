---
sidebar_position: 3
---

# Restful 管理 API

本章節定義 RESTful API Controller 管理相關的 API 規格。

---

## API 端點清單

| 端點 | HTTP Method | 功能 |
|------|-------------|------|
| `/api/getControllers` | GET | 查詢 Controller 清單 |
| `/api/saveController` | POST | 新增 Controller |
| `/api/updateController` | POST | 更新 Controller |
| `/api/removeController` | DELETE | 刪除 Controller |
| `/api/switchController` | GET | 啟用/停用 Controller |

---

## 1. 新增 Restful Controller

### 端點

```
POST /dynamic-api/api/saveController
```

### Request Body

```json
{
  "publishUri": "/api/company",
  "classPath": "com.company.controller.CompanyController",
  "jarFileId": 2
}
```

### Request Schema

| 欄位 | 型別 | 必填 | 說明 |
|------|------|------|------|
| `publishUri` | String | ✅ | 發布路徑（如：`/api/company`） |
| `classPath` | String | ✅ | 完整類別路徑 |
| `jarFileId` | Long | ✅ | JAR 檔案 ID |

:::note Bean Name 差異
與 Endpoint 不同，Restful Controller 不需要 Bean Name
:::

### Response（成功）

```json
{
  "success": true,
  "data": {
    "id": 1,
    "publishUri": "/api/company",
    "classPath": "com.company.controller.CompanyController",
    "jarFileId": 2,
    "isActive": false,
    "createTime": "2026-01-02T10:30:00Z"
  },
  "message": "Controller 新增成功"
}
```

---

## 2. 啟用/停用 Controller

### 端點

```
GET /dynamic-api/api/switchController?id={controllerId}
```

### Request Parameters

| 參數 | 型別 | 必填 | 說明 |
|------|------|------|------|
| `id` | Long | ✅ | Controller ID |

### Response（啟用成功）

```json
{
  "success": true,
  "data": {
    "id": 1,
    "isActive": true
  },
  "message": "Controller 啟用成功"
}
```

### 錯誤範例

```json
{
  "success": false,
  "error": {
    "code": "LOAD_FAILED",
    "message": "路由註冊失敗：Controller 必須有 @RestController 註解"
  },
  "timestamp": "2026-01-02T10:30:00Z"
}
```

---

## 3. 查詢 Controller 清單

### 端點

```
GET /dynamic-api/api/getControllers
```

### Response

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "publishUri": "/api/company",
      "classPath": "com.company.controller.CompanyController",
      "jarFileName": "company-restful.jar",
      "isActive": true,
      "createTime": "2026-01-02T10:30:00Z"
    },
    {
      "id": 2,
      "publishUri": "/api/employee",
      "classPath": "com.company.controller.EmployeeController",
      "jarFileName": "employee-restful.jar",
      "isActive": false,
      "createTime": "2026-01-02T11:00:00Z"
    }
  ],
  "message": "查詢成功"
}
```

---

## 4. 更新 Controller

### 端點

```
POST /dynamic-api/api/updateController
```

### Request Body

```json
{
  "id": 1,
  "classPath": "com.company.controller.CompanyControllerV2",
  "jarFileId": 3
}
```

---

## 5. 刪除 Controller

### 端點

```
DELETE /dynamic-api/api/removeController
```

### Request Body

```json
{
  "id": 1
}
```

---

## 使用範例

### 完整操作流程

```javascript
// 1. 上傳 JAR 檔案
const formData = new FormData();
formData.append('file', jarFile);
const uploadResponse = await axios.post('/dynamic-api/common/uploadJarFile', formData);
const jarFileId = uploadResponse.data.data.id;

// 2. 新增 Controller
const controller = await axios.post('/dynamic-api/api/saveController', {
  publishUri: '/api/company',
  classPath: 'com.company.controller.CompanyController',
  jarFileId: jarFileId
});

// 3. 啟用 Controller
await axios.get(`/dynamic-api/api/switchController?id=${controller.data.data.id}`);

// 4. 測試 API
const result = await axios.get('http://localhost:8080/api/company/list');
console.log(result.data);
```
