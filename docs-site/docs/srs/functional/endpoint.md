---
id: endpoint
title: 3.2 Endpoint 管理（SOAP）
description: 'FR-EP-001～008 Endpoint（SOAP）管理需求：新增、啟用、停用、編輯、刪除、查詢、啟動恢復與 CDATA 處理。'
sidebar_label: 3.2 Endpoint 管理
---

# 3.2 Endpoint 管理（SOAP）

## FR-EP-001 新增 Endpoint

| 項目 | 內容 |
|---|---|
| 描述 | 系統應允許建立 Endpoint 設定 |
| 觸發者 | 管理介面、`POST /ws/saveWebService` |
| 輸入 | `publishUri`、`beanName`、`classPath`（皆必填）、`jarFileId`、`ignoreCdata`（選填，預設 false） |
| 後置條件 | `ENDPOINT` 新增一筆，`IS_ACTIVE=0`；引用的 JAR 狀態改為 `A` |
| 業務規則 | 1. 三個必填欄位任一為空回應 `code=400`<br/>2. `publishUri` 為主鍵，不可重複<br/>3. `jarFileId` 必須存在，否則失敗 |
| 驗收標準 | ✅ 新增後清單出現該筆且為停用<br/>❌ 缺欄位回應 400；`jarFileId` 不存在時回應錯誤 |

## FR-EP-002 啟用 Endpoint

| 項目 | 內容 |
|---|---|
| 描述 | 系統應在不重啟的情況下載入 JAR 中的實作類別並發布 SOAP 服務 |
| 觸發者 | 管理介面開關、`GET /ws/switchWebService?isActive=true` |
| 前置條件 | Endpoint 存在；JAR 檔案存在 |
| 後置條件 | 服務可於 `/dynamic-api/webservice/{publishUri}` 呼叫；`IS_ACTIVE=1` |
| 業務規則 | 1. 以獨立 ClassLoader 載入 `classPath`<br/>2. 以 `beanName` 註冊為 Spring Bean（可注入 `MockResponseDao`）<br/>3. `ignoreCdata=true` 時掛載 CDATA 攔截器（FR-EP-008）<br/>4. 任一步驟失敗時清除 ClassLoader 並回報錯誤，`IS_ACTIVE` 維持 0 |
| 驗收標準 | ✅ 啟用後 `?wsdl` 可取得 WSDL，呼叫可得到 Mock 回應<br/>❌ `classPath` 錯誤時啟用失敗且狀態仍為停用 |

## FR-EP-003 停用 Endpoint

| 項目 | 內容 |
|---|---|
| 描述 | 系統應能撤銷已發布的服務並釋放 ClassLoader |
| 觸發者 | 管理介面開關、`GET /ws/switchWebService?isActive=false` |
| 後置條件 | CXF Server 停止並自登錄移除；ClassLoader 關閉；`IS_ACTIVE=0` |
| 驗收標準 | 停用後呼叫該服務得到 404 類錯誤；可再次啟用 |

## FR-EP-004 編輯 Endpoint

| 項目 | 內容 |
|---|---|
| 描述 | 系統應允許修改 Endpoint 設定或更換 JAR |
| 觸發者 | 管理介面、`POST /ws/updateWebService` |
| 輸入 | `id`、`publishUri`、`beanName`、`classPath`、`jarFileId`（皆必填）、`ignoreCdata` |
| 後置條件 | 原服務已停用；設定更新並為停用；原 JAR 狀態依 FR-JAR-002 |
| 業務規則 | 1. Publish URI 變更時，舊 URI 的設定列被刪除，且該 URI 下的所有 Mock 回應改到新 URI<br/>2. 編輯後需重新啟用 |
| 驗收標準 | ✅ 更換 JAR 後重新啟用，新類別生效<br/>✅ 變更 Publish URI 後，回應清單出現在新 URI 下 |

## FR-EP-005 刪除 Endpoint

| 項目 | 內容 |
|---|---|
| 描述 | 系統應允許一次刪除一或多個 Endpoint |
| 觸發者 | 管理介面（單筆、批次）、`DELETE /ws/removeWebService`（本文為 Publish URI 陣列） |
| 後置條件 | 服務停用、設定刪除、JAR 標為 `D` 並刪除檔案 |
| 業務規則 | Mock 回應不隨之刪除 |

## FR-EP-006 查詢 Endpoint 清單

| 項目 | 內容 |
|---|---|
| 描述 | 系統應列出所有 Endpoint 及其 JAR 資訊 |
| 觸發者 | 管理介面、`GET /ws/getEndpoints` |
| 輸出 | `id`、`publishUri`、`beanName`、`classPath`、`isActive`、`ignoreCdata`、`jarFileId`、`jarFileName` |
| 業務規則 | 管理介面提供關鍵字篩選與分頁（前端處理） |

## FR-EP-007 啟動時恢復 Endpoint

| 項目 | 內容 |
|---|---|
| 描述 | 應用程式啟動時，系統應自動發布所有 `IS_ACTIVE=1` 的 Endpoint |
| 業務規則 | 單筆失敗不影響其他筆；失敗者改為停用並記錄日誌 |
| 驗收標準 | 重啟後先前啟用的服務可直接呼叫 |

## FR-EP-008 CDATA 處理

| 項目 | 內容 |
|---|---|
| 描述 | 當 `ignoreCdata=true`，系統應還原請求與回應中被跳脫的 XML 字元 |
| 業務規則 | 請求（RECEIVE 階段）將 `&lt;`、`&gt;` 還原為 `<`、`>`；回應（PRE_STREAM 階段）另外還原 `&amp;` |
| 驗收標準 | 請求欄位內含 `&lt;![CDATA[x]]&gt;` 時，實作類別收到的值為 `<![CDATA[x]]>` |
