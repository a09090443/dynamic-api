---
id: interfaces
title: 5. 外部介面需求
description: '外部介面需求：管理介面、管理 API 與動態 SOAP／REST 服務等系統介面，以及通訊協定、Port、Context Path 與訊息格式。'
sidebar_label: 5. 外部介面需求
---

# 5. 外部介面需求

## 5.1 使用者介面

| 項目 | 內容 |
|---|---|
| 平台 | 桌面瀏覽器（Chrome、Edge 等現代瀏覽器） |
| 技術 | Next.js 15、React 19、MUI 7 |
| 主要畫面 | 首頁、SOAP Endpoint、RESTful API、Mock 回應、WSDL 轉換、系統資訊 |
| 共通元件 | 左側側欄（窄螢幕換到內容上方）、頂列麵包屑與後端連線狀態、清單（搜尋、狀態篩選、勾選、批次操作、分頁）、新增／編輯對話框、Mock 回應右側編輯面板、確認對話框、toast 訊息（啟停可復原） |

| 畫面 | 路徑 | 主要功能 |
|---|---|---|
| SOAP Endpoint | `/endpoint` | 統計、清單、搜尋與狀態篩選、新增、編輯、刪除、開關、批次啟停與刪除、Mock 回應筆數、前往 WSDL 轉換與 Mock 回應 |
| RESTful API | `/restful` | 清單、新增、編輯、刪除、開關、批次刪除、前往 Mock 回應 |
| Mock 回應 | `/response?publishUri=&serviceType=` | 服務資訊與呼叫位址、回應清單、右側面板新增／編輯／刪除、開關；未指定服務時顯示引導 |
| WSDL 轉換 | `/wsdl` | 以網址或上傳檔案把 WSDL 轉成 Java 原始碼 ZIP 並下載 |
| 系統資訊 | `/about` | 系統說明 |

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
