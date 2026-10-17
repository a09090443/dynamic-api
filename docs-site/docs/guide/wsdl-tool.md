---
id: wsdl-tool
title: WSDL 轉 Java 工具
description: '使用內建 Apache CXF wsdl2java 把 WSDL 轉成 Java 原始碼 ZIP，包含管理介面操作、API 呼叫與轉換參數。'
sidebar_label: WSDL 轉 Java 工具
---

# WSDL 轉 Java 工具

開發 Endpoint JAR 時，最費工的是依照對方的 WSDL 寫出一模一樣的 JAXB 類別。系統內建 Apache CXF `wsdl2java`，可以直接把 WSDL 轉成 Java 原始碼並打包成 ZIP 下載。

## 在管理介面使用

1. 進入 **Endpoint** 頁面，按工具列的 **轉換 WSDL 物件**。
2. 選擇輸入方式：
   - **檔案上傳**：選擇 `.wsdl` 或 `.xml` 檔案。
   - **WSDL URL**：輸入 WSDL 網址。
3. 送出後瀏覽器會下載 `wsdl-objects-{時間戳}.zip`。

:::warning 已知問題：URL 模式目前無法使用
管理介面送出的欄位名稱是 `wsdlPath`，但後端讀取的是 `wsdlUrl`，因此 URL 模式會得到「請提供 WSDL URL 或上傳 WSDL 文件」錯誤。請先把 WSDL 存成檔案後用 **檔案上傳** 模式，或直接呼叫 API（見下方）。
:::

## 直接呼叫 API

```bash
# 以檔案轉換，並指定套件名稱
curl -X POST http://localhost:8080/dynamic-api/ws/genWsdlObj \
  -F "file=@CompanyService.wsdl" \
  -F "packageName=com.company.dto" \
  -o generated.zip

# 以 URL 轉換
curl -X POST http://localhost:8080/dynamic-api/ws/genWsdlObj \
  -F "wsdlUrl=http://localhost:8080/dynamic-api/webservice/company?wsdl" \
  -o generated.zip
```

| 參數 | 必填 | 說明 |
|---|---|---|
| `file` | 與 `wsdlUrl` 擇一 | WSDL 檔案 |
| `wsdlUrl` | 與 `file` 擇一 | WSDL 網址（後端主機需能連到） |
| `packageName` | 否 | 產出類別的套件名稱；不填則依 WSDL 的 namespace 推導。管理介面目前沒有此欄位。 |

成功時回傳 `application/octet-stream`，檔名 `generated_wsdl_object.zip`；若沒有產出任何檔案則回傳 HTTP 204。

## 轉換參數與注意事項

- 後端執行的參數為 `-autoNameResolution -d <暫存目錄> [-p <packageName>] -client <wsdl>`，因此 ZIP 中除了 DTO，也會有 Service 介面與 client 範例類別，挑需要的放進專案即可。
- 轉換使用 `wsdl.objects.tmp.dir`（預設 `D:/tmp/wsdl/`）當暫存目錄，**完成後會把整個目錄連同內容刪除**，請不要把其他檔案放在那裡。
- 同一時間只會執行一個轉換（以全域鎖序列化）。

產出的類別要怎麼調整成可用的 Endpoint，請看 [開發 Endpoint JAR](../jar-dev/endpoint-jar.md)。
