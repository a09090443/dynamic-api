---
id: mock-response
title: 3.4 Mock 回應管理
sidebar_label: 3.4 Mock 回應管理
---

# 3.4 Mock 回應管理

## FR-MR-001 新增 Mock 回應

| 項目 | 內容 |
|---|---|
| 觸發者 | 管理介面、`POST /common/saveMockResponse` |
| 輸入 | `publishUri`、`method`、`condition`（必填）、`serviceType`、`responseContent` |
| 後置條件 | `MOCK_RESPONSE` 新增一筆，產生 UUID 作為 `id`，`IS_ACTIVE=0` |
| 業務規則 | 1. 必填欄位為空回應 `code=400`<br/>2. `(publishUri, method, condition, serviceType)` 為主鍵；鍵值完全相同時覆寫既有資料 |
| 驗收標準 | 新增後回應清單出現該筆且為停用 |

## FR-MR-002 查詢 Mock 回應清單

| 項目 | 內容 |
|---|---|
| 觸發者 | 管理介面、`POST /common/getResponseList` |
| 輸入 | `publishUri`（必填）、`serviceType` |
| 輸出 | `id`、`publishUri`、`method`、`condition`、`responseContent`、`isActive` |
| 業務規則 | 依 `publishUri` 與 `serviceType` 篩選 |

## FR-MR-003 編輯 Mock 回應

| 項目 | 內容 |
|---|---|
| 觸發者 | 管理介面、`POST /common/updateResponse` |
| 業務規則 | 因 `condition` 為主鍵的一部分，系統以「刪除原 `id` 再新增」實作；結果為新的 `id`、`IS_ACTIVE=0` |
| 驗收標準 | 編輯後清單顯示新內容；重新啟用後呼叫取得新內容 |

## FR-MR-004 啟用／停用 Mock 回應

| 項目 | 內容 |
|---|---|
| 觸發者 | 管理介面開關、`GET /common/switchResponse?id=&isActive=` |
| 業務規則 | 立即生效，不需重新啟用服務 |

## FR-MR-005 刪除 Mock 回應

| 項目 | 內容 |
|---|---|
| 觸發者 | 管理介面（單筆、批次）、`DELETE /common/deleteResponse`（本文為 `id` 陣列） |

## FR-MR-006 執行期回應查詢

| 項目 | 內容 |
|---|---|
| 描述 | 系統應提供 JAR 以四個鍵查詢回應內容的 API |
| 介面 | `RestfulBase.findByPrimaryKey(publishUri, method, condition, clazz)`、`WebserviceBase.findByPrimaryKey(...)` |
| 業務規則 | 1. 四鍵完全相等且 `IS_ACTIVE=1` 才命中<br/>2. 命中時回傳 `RESPONSE_CONTENT`<br/>3. 查無或發生例外時回傳 `clazz` 的無參數實例（`String` 為空字串），並記錄錯誤日誌 |
| 驗收標準 | ✅ 啟用的回應可被查到<br/>✅ 停用後同一請求查不到 |

## FR-MR-007 依條件取得單筆回應內容

| 項目 | 內容 |
|---|---|
| 觸發者 | `POST /common/getResponseContent` |
| 輸入 | `publishUri`、`method`、`condition`、`serviceType` |
| 輸出 | 命中時為回應內容，否則為空字串 |
| 用途 | 不經過 JAR，直接驗證某組鍵值會取得什麼回應 |

## FR-MR-008 Publish URI 連動

| 項目 | 內容 |
|---|---|
| 描述 | 服務的 Publish URI 變更時，原 URI 下的 Mock 回應應改到新 URI |
| 現況 | 以 `UPDATE MOCK_RESPONSE SET PUBLISH_URI = :new WHERE PUBLISH_URI = :old` 實作，**不區分 `serviceType`**；若 SOAP 與 REST 使用相同 Publish URI，兩者的回應會一起搬移 |
