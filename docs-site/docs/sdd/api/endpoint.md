---
id: endpoint
title: 5.2 Endpoint API（/ws）
sidebar_label: 5.2 Endpoint API
---

# 5.2 Endpoint API（`/dynamic-api/ws`）

## 資料結構

**EndpointResponseDTO**（清單與儲存的回傳）

| 欄位 | 型別 | 說明 |
|---|---|---|
| `id` | string | UUID |
| `publishUri` | string | |
| `beanName` | string | |
| `classPath` | string | |
| `jarFileId` | string | |
| `jarFileName` | string | `{UUID}.jar` |
| `isActive` | boolean | |
| `ignoreCdata` | boolean | |

**WebServiceRequestDTO**（新增／修改的請求）

| 欄位 | 型別 | 新增 | 修改 |
|---|---|---|---|
| `id` | string | — | 必填 |
| `publishUri` | string | 必填 | 必填 |
| `beanName` | string | 必填 | 必填 |
| `classPath` | string | 必填 | 必填 |
| `jarFileId` | string | 實際必填 | 必填 |
| `ignoreCdata` | boolean | 選填 | 選填 |

（另有 `jarFileName`、`isActive`、`wsdlPath`、`outputDir`、`zipFilePath` 欄位，後端不使用。）

---

## GET `/getEndpoints`

取得所有 Endpoint。

```json title="回應"
{
  "code": 200, "message": "OK",
  "data": [
    {
      "id": "7d0e…", "publishUri": "company", "beanName": "companyWebServiceImpl",
      "classPath": "com.company.webservice.impl.CompanyWebServiceImpl",
      "jarFileId": "03ac…", "jarFileName": "5b1f….jar",
      "isActive": true, "ignoreCdata": false
    }
  ]
}
```

## POST `/saveWebService`

新增 Endpoint（停用狀態）。

```json title="請求"
{
  "publishUri": "company",
  "beanName": "companyWebServiceImpl",
  "classPath": "com.company.webservice.impl.CompanyWebServiceImpl",
  "jarFileId": "03ac1ee7-b90f-47f7-94b6-2e965140f646",
  "ignoreCdata": false
}
```

| 結果 | 回應 |
|---|---|
| 成功 | `code=200`，`data` 為 EndpointResponseDTO（含新 `id`、`jarFileName`） |
| 必填欄位空白 | `code=400` |
| 寫入失敗（例如 `jarFileId` 不存在、主鍵衝突） | `code=400` |

## POST `/updateWebService`

修改 Endpoint。流程：停用原服務 → 儲存新設定（停用）→ 原 JAR 狀態 `I` →（URI 變更）刪除舊設定、原 JAR 標 `D`、搬移 Mock 回應 →（JAR 變更）原 JAR 標 `D`。

請求同 `saveWebService` 並加上 `id`。成功回傳更新後的 EndpointResponseDTO（`isActive=false`）。

## DELETE `/removeWebService`

```json title="請求本文：Publish URI 陣列"
["company", "user-service"]
```

逐一：停用 → 刪除設定 → JAR 標 `D` 並刪檔。回應 `data` 為空字串。

## GET `/switchWebService`

| 參數 | 型別 | 說明 |
|---|---|---|
| `publishUri` | string | |
| `isActive` | boolean | `true` 啟用（載入並發布）、`false` 停用 |

```
GET /dynamic-api/ws/switchWebService?publishUri=company&isActive=true
```

啟用失敗時丟出 `WebserviceException("啟動 Webservice 失敗")`，HTTP 500（格式見 [5.1 慣例](./conventions.md#回應格式)）。

## POST `/genWsdlObj`

`multipart/form-data`：

| 欄位 | 必填 | 說明 |
|---|---|---|
| `file` | 與 `wsdlUrl` 擇一 | WSDL 檔 |
| `wsdlUrl` | 與 `file` 擇一 | WSDL 網址 |
| `packageName` | 否 | 產出套件名稱 |

| 結果 | 回應 |
|---|---|
| 成功 | HTTP 200，`application/octet-stream`，`Content-Disposition: attachment; filename=generated_wsdl_object.zip` |
| 無產出 | HTTP 204 |
| 失敗（兩者皆未提供、WSDL 無效） | HTTP 500 |

此端點回傳 `ResponseEntity<byte[]>`，**不**包成 `{code, message, data}`。
