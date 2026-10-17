---
id: tools
title: 3.5 輔助工具
description: 'FR-TOOL-001 WSDL 轉 Java 原始碼與 FR-TOOL-002 日誌即時串流的需求。'
sidebar_label: 3.5 輔助工具
---

# 3.5 輔助工具

## FR-TOOL-001 WSDL 轉 Java 原始碼

| 項目 | 內容 |
|---|---|
| 描述 | 系統應能由 WSDL 產生 JAX-WS / JAXB Java 原始碼並提供 ZIP 下載 |
| 觸發者 | 管理介面「轉換 WSDL 物件」、`POST /ws/genWsdlObj`（multipart） |
| 輸入 | `file`（WSDL 檔）或 `wsdlUrl` 擇一；`packageName` 選填 |
| 輸出 | `application/octet-stream`，`generated_wsdl_object.zip`；無產出時 HTTP 204 |
| 業務規則 | 1. 使用 CXF `WSDLToJava`，參數 `-autoNameResolution -client`<br/>2. 以 `wsdl.objects.tmp.dir` 為工作目錄，完成後刪除<br/>3. 同時間僅允許一個轉換執行 |
| 驗收標準 | ✅ 上傳有效 WSDL 取得含 Java 檔的 ZIP<br/>❌ 兩者皆未提供時回報錯誤 |
| 已知問題 | KI-03：管理介面 URL 模式送出 `wsdlPath` 欄位，後端無法辨識 |

## FR-TOOL-002 日誌即時串流

| 項目 | 內容 |
|---|---|
| 描述 | 系統應能以 SSE 串流日誌檔的末段與後續新增內容 |
| 觸發者 | `GET /common/logs/stream?logFileName=&tailLines=` |
| 輸入 | `logFileName`（預設 `MockWebservice.log`）、`tailLines`（預設 100） |
| 業務規則 | 1. 先送出末尾 `tailLines` 行，再監看檔案變更推送新行<br/>2. 連線 30 秒逾時<br/>3. 檔案不存在時送出提示並結束 |
| 現況 | 管理介面尚未提供對應畫面 |
| 風險 | `logFileName` 未限制路徑，可讀取 `log.base` 以外的檔案（見 [4.3 安全性](../non-functional.md#43-安全性與隱私)） |
