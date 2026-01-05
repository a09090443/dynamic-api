---
sidebar_position: 4
---

# 共用功能 API

本章節定義 JAR 檔案管理與 Mock 回應管理相關的 API 規格。

---

## API 端點清單

### JAR 檔案管理

| 端點 | HTTP Method | 功能 |
|------|-------------|------|
| `/common/uploadJarFile` | POST | 上傳 JAR 檔案 |
| `/common/getJarFileList` | GET | 查詢 JAR 清單 |
| `/common/deleteJarFile` | DELETE | 刪除 JAR 檔案 |

### Mock 回應管理

| 端點 | HTTP Method | 功能 |
|------|-------------|------|
| `/common/getResponseList` | POST | 查詢 Mock 回應清單 |
| `/common/saveMockResponse` | POST | 新增 Mock 回應 |
| `/common/updateResponse` | POST | 更新 Mock 回應 |
| `/common/deleteResponse` | DELETE | 刪除 Mock 回應 |
| `/common/switchResponse` | GET | 啟用/停用 Mock 回應 |

---

## JAR 檔案管理 API

### 1. 上傳 JAR 檔案

#### 端點

```
POST /dynamic-api/common/uploadJarFile
```

#### Request

Content-Type: `multipart/form-data`

| 欄位 | 型別 | 必填 | 說明 |
|------|------|------|------|
| `file` | File | ✅ | JAR 檔案（最大 50MB） |

#### Response

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

#### 錯誤範例

```json
{
  "success": false,
  "error": {
    "code": "INVALID_REQUEST",
    "message": "檔案大小超過限制（最大 50MB）"
  },
  "timestamp": "2026-01-02T10:30:00Z"
}
```

---

### 2. 查詢 JAR 清單

#### 端點

```
GET /dynamic-api/common/getJarFileList
```

#### Response

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "fileName": "company-endpoint.jar",
      "status": "INUSED",
      "uploadTime": "2026-01-02T10:30:00Z"
    },
    {
      "id": 2,
      "fileName": "employee-restful.jar",
      "status": "UNUSED",
      "uploadTime": "2026-01-02T11:00:00Z"
    }
  ],
  "message": "查詢成功"
}
```

---

### 3. 刪除 JAR 檔案

#### 端點

```
DELETE /dynamic-api/common/deleteJarFile
```

#### Request Body

```json
{
  "id": 1
}
```

#### 錯誤範例

```json
{
  "success": false,
  "error": {
    "code": "JAR_IN_USE",
    "message": "JAR 檔案使用中，無法刪除"
  },
  "timestamp": "2026-01-02T10:30:00Z"
}
```

---

## Mock 回應管理 API

### 1. 新增 Mock 回應

#### 端點

```
POST /dynamic-api/common/saveMockResponse
```

#### Request Body

```json
{
  "publishUri": "/ws/company",
  "method": "getCompanyInfo",
  "condition": "companyId=001",
  "serviceType": "ENDPOINT",
  "responseContent": "<company><id>001</id><name>ABC Company</name></company>"
}
```

#### Request Schema

| 欄位 | 型別 | 必填 | 說明 |
|------|------|------|------|
| `publishUri` | String | ✅ | 發布路徑 |
| `method` | String | ✅ | 方法名稱或 HTTP Method |
| `condition` | String | ✅ | 條件（`default` 為預設） |
| `serviceType` | String | ✅ | `ENDPOINT` 或 `RESTFUL` |
| `responseContent` | String | ✅ | XML 或 JSON 格式 |

#### Response

```json
{
  "success": true,
  "message": "Mock 回應新增成功"
}
```

---

### 2. 查詢 Mock 回應清單

#### 端點

```
POST /dynamic-api/common/getResponseList
```

#### Request Body

```json
{
  "publishUri": "/ws/company",
  "serviceType": "ENDPOINT"
}
```

#### Response

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

### 3. 更新 Mock 回應

#### 端點

```
POST /dynamic-api/common/updateResponse
```

#### Request Body

```json
{
  "publishUri": "/ws/company",
  "method": "getCompanyInfo",
  "condition": "companyId=001",
  "serviceType": "ENDPOINT",
  "responseContent": "<company><id>001</id><name>New Company Name</name></company>"
}
```

---

### 4. 刪除 Mock 回應

#### 端點

```
DELETE /dynamic-api/common/deleteResponse
```

#### Request Body

```json
{
  "publishUri": "/ws/company",
  "method": "getCompanyInfo",
  "condition": "companyId=001",
  "serviceType": "ENDPOINT"
}
```

---

### 5. 啟用/停用 Mock 回應

#### 端點

```
GET /dynamic-api/common/switchResponse
```

#### Request Parameters

| 參數 | 型別 | 必填 | 說明 |
|------|------|------|------|
| `publishUri` | String | ✅ | 發布路徑 |
| `method` | String | ✅ | 方法名稱 |
| `condition` | String | ✅ | 條件 |
| `serviceType` | String | ✅ | 服務類型 |

#### 範例

```
GET /dynamic-api/common/switchResponse?publishUri=/ws/company&method=getCompanyInfo&condition=default&serviceType=ENDPOINT
```

---

## 使用範例

### 完整流程範例

```javascript
// 1. 上傳 JAR
const uploadJar = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await axios.post('/dynamic-api/common/uploadJarFile', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data.data.id;
};

// 2. 新增 Mock 回應
const addMockResponse = async () => {
  await axios.post('/dynamic-api/common/saveMockResponse', {
    publishUri: '/ws/company',
    method: 'getCompanyInfo',
    condition: 'default',
    serviceType: 'ENDPOINT',
    responseContent: '<company><id>001</id><name>Default Company</name></company>'
  });
};

// 3. 查詢回應清單
const getResponses = async () => {
  const response = await axios.post('/dynamic-api/common/getResponseList', {
    publishUri: '/ws/company',
    serviceType: 'ENDPOINT'
  });
  console.log(response.data.data);
};
```
