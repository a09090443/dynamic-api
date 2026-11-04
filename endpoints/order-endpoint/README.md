# order-endpoint

SOAP Endpoint JAR 範例：訂單查詢與訂單狀態查詢。示範手寫 JAXB 類別（document/literal BARE）、Mock 內容只放回應元素，以及查不到 Mock 回應時回傳內容明確的 SOAP Fault，而不是未處理的例外。

| 項目 | 值 |
|---|---|
| Publish URI | `order` |
| Bean 名稱 | `orderWebServiceImpl` |
| Class 路徑（實作類別，不是介面） | `com.sample.order.webservice.impl.OrderWebServiceImpl` |
| 介面（SEI） | `com.sample.order.webservice.OrderWebService` |
| targetNamespace | `http://order.sample.com/` |

## Operation 對照

| operation | 請求元素 | 回應元素 | methodKey | condition |
|---|---|---|---|---|
| `getOrder` | `GetOrderRequest` | `GetOrderResponse` | `getOrder` | 請求的 `orderId` 去除前後空白，例如 `A001` |
| `getOrderStatus` | `GetOrderStatusRequest` | `GetOrderStatusResponse` | `getOrderStatus` | 請求的 `orderId` 去除前後空白，例如 `A001` |

## 可直接建立的 Mock 回應

Mock 回應內容**只放回應元素本身的 XML，並使用預設 namespace**（`xmlns="http://order.sample.com/"`），不要貼整個 SOAP envelope。程式以 JAXB 轉換，不依賴 namespace 前綴。

| Publish URI | Method | Condition | 回應內容 |
|---|---|---|---|
| `order` | `getOrder` | `A001` | `<GetOrderResponse xmlns="http://order.sample.com/"><orderId>A001</orderId><customerName>王小明</customerName><status>SHIPPED</status><totalAmount>1280.00</totalAmount><orderDate>2026-11-01</orderDate></GetOrderResponse>` |
| `order` | `getOrderStatus` | `A001` | `<GetOrderStatusResponse xmlns="http://order.sample.com/"><orderId>A001</orderId><status>SHIPPED</status><updatedAt>2026-11-02T10:30:00</updatedAt></GetOrderStatusResponse>` |

## 錯誤回應（SOAP Fault）

| 情況 | faultcode | faultstring |
|---|---|---|
| `orderId` 缺少或空白（不會查詢 Mock） | `Client` | `orderId is required` |
| 查不到啟用中的 Mock 回應，或內容為空白 | `Server` | `No active mock response: publishUri=order, method=<methodKey>, condition=<orderId>` |
| Mock 內容無法轉成回應元素（XML 錯誤、根元素或 namespace 不符） | `Server` | `Invalid mock response XML: publishUri=order, method=<methodKey>, condition=<orderId>` |

## 建置

本範例不附 Gradle Wrapper，使用系統安裝的 Gradle（機器上需要 JDK 17）：

```bash
gradle jar
```

上傳 `build/libs/order-endpoint-1.0-plain.jar`。不要用 `gradle build` 產生的 boot JAR，它的類別位於 `BOOT-INF/classes/`，系統無法載入。

## 使用流程

1. 在管理介面上傳 `order-endpoint-1.0-plain.jar`。
2. 建立 Endpoint：Publish URI 填 `order`，Bean 名稱填 `orderWebServiceImpl`，Class 路徑填 `com.sample.order.webservice.impl.OrderWebServiceImpl`。
3. 手動啟用該 Endpoint（新建或編輯後預設為停用）。
4. 依上表建立 Mock 回應。
5. 手動啟用 Mock 回應（新建或編輯後預設為停用）。
6. 依下一節呼叫。

停用服務時，系統以「發布位址以 Publish URI 結尾」比對要撤銷的服務，因此不要同時建立另一個以 `order` 結尾的 Publish URI（例如 `purchase-order`），以免停用時誤撤銷。

## 呼叫方法

> 以下呼叫範例**尚未在執行中的系統實際呼叫驗證**。呼叫成功的前提：已上傳 JAR、已建立並啟用 Endpoint、已建立並啟用對應的 Mock 回應。

- 服務網址：`http://localhost:8080/dynamic-api/webservice/order`
- WSDL：`http://localhost:8080/dynamic-api/webservice/order?wsdl`
- 使用 SOAP 1.1，`Content-Type: text/xml; charset=utf-8`；WSDL 沒有定義 soapAction，不需要帶 `SOAPAction` 標頭。

### getOrder

```xml
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ord="http://order.sample.com/">
   <soapenv:Header/>
   <soapenv:Body>
      <ord:GetOrderRequest>
         <ord:orderId>A001</ord:orderId>
      </ord:GetOrderRequest>
   </soapenv:Body>
</soapenv:Envelope>
```

```bash
curl -X POST http://localhost:8080/dynamic-api/webservice/order \
  -H 'Content-Type: text/xml; charset=utf-8' \
  -d '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ord="http://order.sample.com/"><soapenv:Header/><soapenv:Body><ord:GetOrderRequest><ord:orderId>A001</ord:orderId></ord:GetOrderRequest></soapenv:Body></soapenv:Envelope>'
```

### getOrderStatus

```xml
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ord="http://order.sample.com/">
   <soapenv:Header/>
   <soapenv:Body>
      <ord:GetOrderStatusRequest>
         <ord:orderId>A001</ord:orderId>
      </ord:GetOrderStatusRequest>
   </soapenv:Body>
</soapenv:Envelope>
```

```bash
curl -X POST http://localhost:8080/dynamic-api/webservice/order \
  -H 'Content-Type: text/xml; charset=utf-8' \
  -d '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ord="http://order.sample.com/"><soapenv:Header/><soapenv:Body><ord:GetOrderStatusRequest><ord:orderId>A001</ord:orderId></ord:GetOrderStatusRequest></soapenv:Body></soapenv:Envelope>'
```

把 `A001` 換成沒有建立 Mock 的值（例如 `B999`），會得到 `faultcode` 為 `Server`、訊息為 `No active mock response: publishUri=order, method=getOrder, condition=B999` 的 SOAP Fault。

Postman 請求見 `postman/Endpoints.postman_collection.json` 的 `Order` 資料夾；詳細說明見文件網站的 [開發 Endpoint JAR](../../docs-site/docs/jar-dev/endpoint-jar.md)。
