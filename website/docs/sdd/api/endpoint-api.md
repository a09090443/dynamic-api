---
sidebar_position: 2
---

# Endpoint 管理 API

本章節定義 WSDL Endpoint 管理相關的 API 規格。

---

## API 端點清單

| 端點 | HTTP Method | 功能 |
|------|-------------|------|
| `/ws/getEndpoints` | GET | 查詢 Endpoint 清單 |
| `/ws/saveWebService` | POST | 新增 Endpoint |
| `/ws/updateWebService` | POST | 更新 Endpoint |
| `/ws/removeWebService` | DELETE | 刪除 Endpoint |
| `/ws/switchWebService` | GET | 啟用/停用 Endpoint |
| `/ws/genWsdlObj` | POST | WSDL 轉 Java 物件 |

---

## 1. 新增 Endpoint

### 端點

```
POST /dynamic-api/ws/saveWebService
```

### Request Body

```json
{
  "publishUri": "/ws/company",
  "beanName": "companyWebService",
  "classPath": "com.company.webservice.impl.CompanyWebServiceImpl",
  "jarFileId": 1
}
```

### Request Schema

| 欄位 | 型別 | 必填 | 說明 |
|------|------|------|------|
| `publishUri` | String | ✅ | 發布路徑（如：`/ws/company`） |
| `beanName` | String | ✅ | Spring Bean 名稱 |
| `classPath` | String | ✅ | 完整類別路徑 |
| `jarFileId` | Long | ✅ | JAR 檔案 ID |

### Response（成功）

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

### Response（失敗）

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

## 2. 啟用/停用 Endpoint

### 端點

```
GET /dynamic-api/ws/switchWebService?id={endpointId}
```

### Request Parameters

| 參數 | 型別 | 必填 | 說明 |
|------|------|------|------|
| `id` | Long | ✅ | Endpoint ID |

### Response（啟用成功）

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

### Response（載入失敗）

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

## 3. 查詢 Endpoint 清單

### 端點

```
GET /dynamic-api/ws/getEndpoints
```

### Request Parameters

無（未來可擴展分頁與篩選）

### Response

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

## 4. 更新 Endpoint

### 端點

```
POST /dynamic-api/ws/updateWebService
```

### Request Body

```json
{
  "id": 1,
  "beanName": "companyWebServiceV2",
  "classPath": "com.company.webservice.impl.CompanyWebServiceImplV2",
  "jarFileId": 2
}
```

:::warning 限制
不可更改 `publishUri`（若需更改，應刪除後重建）
:::

### Response（成功）

```json
{
  "success": true,
  "message": "Endpoint 更新成功"
}
```

---

## 5. 刪除 Endpoint

### 端點

```
DELETE /dynamic-api/ws/removeWebService
```

### Request Body

```json
{
  "id": 1
}
```

### Response（成功）

```json
{
  "success": true,
  "message": "Endpoint 刪除成功"
}
```

### Response（失敗）

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

## 6. WSDL 轉 Java 物件

### 端點

```
POST /dynamic-api/ws/genWsdlObj
```

### Request Body

```json
{
  "wsdlUrl": "http://example.com/service?wsdl",
  "packageName": "com.company.generated"
}
```

或上傳 WSDL 檔案（`multipart/form-data`）：

```
wsdlFile: [WSDL 檔案]
packageName: com.company.generated
```

### Response

返回 ZIP 檔案（包含產生的 Java 原始碼）

---

## 錯誤處理範例

### 常見錯誤情境

| 錯誤碼 | 情境 | 處理建議 |
|--------|------|---------|
| `PUBLISH_URI_EXISTS` | Publish URI 重複 | 使用不同的 URI 或刪除既有 Endpoint |
| `BEAN_NAME_EXISTS` | Bean Name 重複 | 使用不同的 Bean Name |
| `JAR_FILE_NOT_FOUND` | JAR 檔案不存在 | 確認 JAR 檔案 ID 正確 |
| `CLASS_NOT_FOUND` | 類別不存在 | 確認 Class Path 正確且 JAR 包含該類別 |
| `ENDPOINT_ACTIVE` | 啟用中無法刪除 | 先停用 Endpoint 再刪除 |

---

## 使用範例

### 使用 cURL

```bash
# 新增 Endpoint
curl -X POST http://localhost:8080/dynamic-api/ws/saveWebService \
  -H "Content-Type: application/json" \
  -d '{
    "publishUri": "/ws/company",
    "beanName": "companyWebService",
    "classPath": "com.company.webservice.impl.CompanyWebServiceImpl",
    "jarFileId": 1
  }'

# 啟用 Endpoint
curl -X GET "http://localhost:8080/dynamic-api/ws/switchWebService?id=1"

# 查詢清單
curl -X GET http://localhost:8080/dynamic-api/ws/getEndpoints
```

### 使用 JavaScript (Axios)

```javascript
import axios from 'axios';

// 新增 Endpoint
const createEndpoint = async () => {
  try {
    const response = await axios.post('/dynamic-api/ws/saveWebService', {
      publishUri: '/ws/company',
      beanName: 'companyWebService',
      classPath: 'com.company.webservice.impl.CompanyWebServiceImpl',
      jarFileId: 1
    });
    console.log('成功:', response.data);
  } catch (error) {
    console.error('失敗:', error.response.data);
  }
};

// 啟用 Endpoint
const toggleEndpoint = async (id) => {
  try {
    const response = await axios.get(`/dynamic-api/ws/switchWebService?id=${id}`);
    console.log('成功:', response.data);
  } catch (error) {
    console.error('失敗:', error.response.data);
  }
};
```
