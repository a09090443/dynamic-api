---
id: restful
title: 5.3 RESTful API（/dynamic-api/api）
description: 'RESTful 管理 API（/dynamic-api/api）規格：DTO 結構，查詢、新增、修改、刪除、啟停用端點，以及 Actuator 路由查詢。'
sidebar_label: 5.3 RESTful API
---

# 5.3 RESTful API（/dynamic-api/api）

## 資料結構

**ControllerDTO**（請求）／**ControllerResponseDTO**（回應）

| 欄位 | 型別 | 新增 | 修改 | 說明 |
|---|---|---|---|---|
| `id` | string | — | 必填 | UUID |
| `publishUri` | string | 必填 | 必填 | 必須等於類別 `@RequestMapping` 第一段 |
| `classPath` | string | 必填 | 必填 | |
| `jarFileId` | string | 實際必填 | 必填 | |
| `jarFileName` | string | — | — | 回應時提供 |
| `isActive` | boolean | — | — | 回應時提供 |

---

## GET `/getControllers`

取得所有 RESTful 設定。

```json title="回應"
{
  "code": 200, "message": "OK",
  "data": [
    {
      "id": "c1a2…", "publishUri": "company",
      "classPath": "com.company.controller.CompanyController",
      "jarFileId": "9f00…", "jarFileName": "77ab….jar", "isActive": true
    }
  ]
}
```

## POST `/saveController`

```json title="請求"
{
  "publishUri": "company",
  "classPath": "com.company.controller.CompanyController",
  "jarFileId": "9f00…"
}
```

| 結果 | 回應 |
|---|---|
| 成功 | `code=200`，`data` 為 ControllerResponseDTO |
| 必填欄位空白 | `code=400` |
| 寫入失敗 | `ControllerException("儲存 Controller 失敗")`，HTTP 500 |

## POST `/updateController`

與 [`/ws/updateWebService`](./endpoint.md#post-updatewebservice) 相同的編排流程。差異：停用原 Controller 時同時把原 JAR 標為 `I`。

## DELETE `/removeController`

本文為 Publish URI 陣列，逐一停用、刪除設定、JAR 標 `D` 並刪檔。

## GET `/switchController`

| 參數 | 說明 |
|---|---|
| `publishUri` | |
| `isActive` | `true`：`enabledController`；`false`：`disabledController` 並將 JAR 標為 `I` |

啟用失敗時（類別不存在、路徑不一致等）丟出 `ControllerException`，HTTP 500。

## Actuator：GET `/actuator/show-mappings`

列出所有已啟用 RESTful 的實際對應（`RequestMappingInfo` 字串 → `HandlerMethod` 字串）。需先在 `application.yml` 將 `management.endpoints.web.exposure.include` 加入 `show-mappings` 才能存取（目前設定值為 `custom-api-mappings`）。
