---
id: endpoint
title: 管理 Endpoint（SOAP Web Service）
description: '在管理介面新增、啟用、停用、編輯、刪除 SOAP Endpoint 的操作方式，以及 Ignore CDATA 選項的作用。'
sidebar_label: 管理 Endpoint
---

# 管理 Endpoint（SOAP Web Service）

**Endpoint** 頁面（`/dynamic-api/endpoint`）用來管理從 JAR 載入的 JAX-WS 服務。

## 畫面功能

| 位置 | 功能 |
|---|---|
| 工具列 **新增 Endpoint** | 上傳 JAR 並建立新的 Endpoint |
| 工具列 **移除 Endpoint (n)** | 刪除勾選的 Endpoint |
| 工具列 **轉換 WSDL 物件** | 開啟 [WSDL 轉 Java 工具](./wsdl-tool.md) |
| 工具列 **搜尋** | 在目前清單中篩選 |
| 每列 **開關** | 啟用／停用服務 |
| 每列 **編輯 / 刪除** | 修改或刪除單筆 |
| 每列 **回應清單** | 前往該 Publish URI 的 [Mock 回應](./mock-response.md) 頁面 |

## 新增 Endpoint

| 欄位 | 必填 | 說明 |
|---|---|---|
| 發布名稱 (Publish URI) | 是 | 服務路徑，例如 `company` → `/dynamic-api/webservice/company`。不可與現有 Endpoint 重複（資料表主鍵）。 |
| Bean 名稱 | 是 | 註冊到 Spring 容器的名稱，例如 `companyWebServiceImpl`。請避免與系統內建 Bean 同名，否則會覆蓋掉它。 |
| Class 路徑 | 是 | 實作類別的完整名稱，例如 `com.company.webservice.impl.CompanyWebServiceImpl`。 |
| JAR 檔案 | 新增時實際必填 | 表單不會擋，但沒有 JAR 時後端會回報「找不到對應的 Jar 檔案」。請上傳 `-plain.jar`。 |
| Ignore CDATA | 否 | 見下方說明。 |

儲存後 Endpoint 為**停用**狀態，打開開關才會真正載入類別並發布。

啟用成功後可用瀏覽器開啟 WSDL 確認：

```
http://localhost:8080/dynamic-api/webservice/{publishUri}?wsdl
```

## 啟用與停用

- **啟用**：系統為這個 Endpoint 建立獨立的 ClassLoader 載入 JAR，把實作類別註冊成 Spring Bean，再用 Apache CXF 發布。任何一步失敗（類別找不到、Bean 建立失敗等），開關會維持關閉並顯示錯誤。
- **停用**：停止 CXF Server、關閉 ClassLoader。資料與 JAR 檔案都保留，隨時可以再啟用。
- **系統重啟**：啟用中的 Endpoint 會在啟動時自動重新發布；失敗的會被自動改為停用，原因記錄在後端日誌。

## Ignore CDATA

部分呼叫端會把 XML 片段以跳脫字元（`&lt;![CDATA[...]]&gt;`）放在 SOAP 欄位裡。開啟 **Ignore CDATA** 後，系統會在這個 Endpoint 加上兩個 CXF 攔截器：

| 攔截器 | 階段 | 作用 |
|---|---|---|
| `CdataContentInterceptor` | 請求 `RECEIVE` | 把請求本文中的 `&lt;`、`&gt;` 還原成 `<`、`>`（包含 CDATA 標記） |
| `ResponseCdataInterceptor` | 回應 `PRE_STREAM` | 把回應中的 `&lt;`、`&gt;`、`&amp;` 還原 |

:::caution
這是整份訊息的字串取代，不會辨識 XML 結構。若欄位內容本來就需要保留 `&lt;` 這類跳脫字元，開啟後會被一併還原，請只在確實需要時開啟。
:::

## 編輯

編輯時系統會依序：停用原 Endpoint → 以新資料覆寫設定（存成**停用**）→ 把原 JAR 標記為未使用。因此**編輯完成後需要重新打開開關**。

若修改了 Publish URI，該 URI 底下的所有 Mock 回應會一併改到新的 URI。

:::warning 已知問題：只改 Publish URI 而不換 JAR 會讓 JAR 檔被刪除
修改 Publish URI 時，系統會把「舊設定所使用的 JAR」標記為已刪除並刪除實體檔案；若你沒有重新上傳 JAR，新設定仍指向同一個 JAR，之後啟用會失敗。**修改 Publish URI 時，請同時重新選擇 JAR 檔案上傳。**
:::

## 刪除

刪除會停用服務、移除設定，並把對應 JAR 標記為已刪除、刪除 `jar.file.dir` 中的實體檔案。

該 Publish URI 底下的 Mock 回應**不會**被刪除；若之後用同一個 Publish URI 重新建立，舊回應會直接沿用。
