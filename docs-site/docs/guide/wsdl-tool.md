---
id: wsdl-tool
title: WSDL 轉 Java 工具
description: '使用內建 Apache CXF wsdl2java 把 WSDL 轉成 Java 原始碼 ZIP：管理介面 WSDL 轉換頁的操作、失敗處理、API 呼叫與轉換參數。'
sidebar_label: WSDL 轉 Java 工具
---

# WSDL 轉 Java 工具

開發 Endpoint JAR 時，最費工的是依照對方的 WSDL 寫出一模一樣的 JAXB 類別。系統內建 Apache CXF `wsdl2java`，可以直接把 WSDL 轉成 Java 原始碼並打包成 ZIP 下載。

## 在管理介面使用

1. 從左側側欄「工具 › WSDL 轉換」，或 SOAP Endpoint 頁首的 **WSDL 轉換** 按鈕，進入 **WSDL 轉換** 頁（`/dynamic-api/wsdl`）。
2. 在「WSDL 來源」選擇來源類型（兩者擇一）：
   - **WSDL 網址**：輸入 WSDL 網址。網址是由後端去讀取，所以要填後端主機連得到的位址。
   - **上傳檔案**：選擇或拖曳一個 `.wsdl` 或 `.xml` 檔案。
3. 視需要填 **Package 名稱（選填）**；留空則依 WSDL 的 targetNamespace 決定。
4. 按 **轉換並下載**。轉換中按鈕會停用，來源類型、網址、檔案與 Package 名稱也會鎖定，結果一定對應按下時的輸入；成功後右側「轉換結果」顯示「已產生並開始下載」，瀏覽器下載 `generated_wsdl_object.zip`，可再按 **重新下載**。

沒有填網址、沒有選檔案或副檔名不符時，欄位下方會顯示原因，不會送出。轉換不會新增或變更任何 Endpoint。

### 轉換失敗時

後端回傳 HTTP 204（沒有產出任何檔案）、HTTP 錯誤或連線失敗時，「轉換結果」會顯示「無法轉換：讀不到這個 WSDL」與後端訊息（有的話），並提供 **再試一次**。已輸入的網址、檔案與 Package 名稱都會保留。常見原因是網址打錯或後端主機連不到該網址，可改用上傳檔案。

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
| `packageName` | 否 | 產出類別的套件名稱；不填則依 WSDL 的 namespace 推導。管理介面的「Package 名稱」欄位即送出此參數。 |

成功時回傳 `application/octet-stream`，檔名 `generated_wsdl_object.zip`；若沒有產出任何檔案則回傳 HTTP 204；轉換過程發生例外時回傳 HTTP 500 與純文字錯誤訊息。

## 轉換參數與注意事項

- 後端執行的參數為 `-autoNameResolution -d <暫存目錄> [-p <packageName>] -client <wsdl>`，因此 ZIP 中除了 DTO，也會有 Service 介面與 client 範例類別，挑需要的放進專案即可。
- 轉換使用 `wsdl.objects.tmp.dir`（預設 `/tmp/wsdl/`）當暫存目錄，**完成後會把整個目錄連同內容刪除**，請不要把其他檔案放在那裡。
- 同一時間只會執行一個轉換（以全域鎖序列化）。

產出的類別要怎麼調整成可用的 Endpoint，請看 [開發 Endpoint JAR](../jar-dev/endpoint-jar.md)。
