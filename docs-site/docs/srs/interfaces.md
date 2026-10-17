---
id: interfaces
title: 5. 外部介面需求
sidebar_label: 5. 外部介面需求
---

# 5. 外部介面需求

## 5.1 使用者介面

| 項目 | 內容 |
|---|---|
| 平台 | 桌面瀏覽器（Chrome、Edge 等現代瀏覽器） |
| 技術 | Next.js 15、React 19、MUI 7 |
| 主要畫面 | 首頁、Endpoint 管理、RESTful 管理、Response 管理、關於 |
| 共通元件 | 頂部導覽列、清單（搜尋、勾選、分頁）、新增／編輯對話框、確認對話框、訊息提示 |

| 畫面 | 路徑 | 主要功能 |
|---|---|---|
| Endpoint | `/endpoint` | 清單、新增、編輯、刪除、開關、WSDL 工具、前往回應清單 |
| RESTful | `/restful` | 清單、新增、編輯、刪除、開關、前往回應清單 |
| Response | `/response?publishUri=&serviceType=` | 回應清單、新增、編輯、刪除、開關、展開檢視內容 |
| 關於 | `/about` | 系統說明 |

## 5.2 系統介面

| 介面 | 方向 | 說明 |
|---|---|---|
| 管理 API | 前端／外部工具 → 後端 | JSON over HTTP，見 [SDD 5. 介面與 API 設計](../sdd/api/conventions.md) |
| 動態 SOAP 服務 | 受測系統 → 後端 | SOAP 1.1 over HTTP，`/dynamic-api/webservice/{publishUri}` |
| 動態 REST 服務 | 受測系統 → 後端 | 依 JAR 定義，`/dynamic-api/{publishUri}/...` |
| 基底類別 API | 自訂 JAR → 後端 | `findByPrimaryKey(...)`，見 [base-jar](../jar-dev/base-jar.md) |
| WSDL 下載 | 外部 → 後端（URL 模式） | 後端主動連線取得 WSDL |

## 5.3 硬體介面

無。

## 5.4 通訊介面

| 項目 | 內容 |
|---|---|
| 協定 | HTTP/1.1（未設定 HTTPS） |
| Port | 8080（後端）、3000（前端開發模式） |
| Context Path | `/dynamic-api` |
| 訊息格式 | 管理 API：JSON（UTF-8），上傳：`multipart/form-data`；SOAP：`text/xml`；日誌串流：`text/event-stream` |
| 回應包裝 | 管理 API 統一為 `{ code, message, data }` |
