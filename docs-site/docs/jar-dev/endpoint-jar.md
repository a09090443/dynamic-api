---
id: endpoint-jar
title: 開發 Endpoint JAR（SOAP）
sidebar_label: 開發 Endpoint JAR
---

# 開發 Endpoint JAR（SOAP）

以 `endpoints/company-endpoint` 為藍本。SOAP 服務的難點在於讓發布出來的 WSDL 與對方系統一致，建議從對方提供的 WSDL 產生類別。

## 1. 從 WSDL 產生類別

用系統內建的 [WSDL 轉 Java 工具](../guide/wsdl-tool.md)（或 Apache CXF 的 `wsdl2java`）取得：

- Service Endpoint Interface（SEI），例如 `CompanyWebService`
- Request / Response 包裝類別（`GetCompany`、`GetCompanyResponse`）
- 資料類別（`CompanyRequest`、`CompanyResponse`、`Employee`）
- `package-info.java`（命名空間設定）

client 端的類別（`*_Service`、`*Client`）不需要。

## 2. build.gradle.kts

```kotlin
dependencies {
    implementation("io.github.a09090443:base-spring-boot-starter:3.2.5.4")
    implementation("io.github.a09090443:web-service-spring-boot-starter:3.2.5.2")
    implementation("org.glassfish.jaxb:jaxb-runtime:4.0.5")
    implementation("jakarta.xml.bind:jakarta.xml.bind-api:4.0.2")
    implementation(files("src/main/lib/base.jar"))

    compileOnly("org.projectlombok:lombok:1.18.32")
    annotationProcessor("org.projectlombok:lombok:1.18.32")
}
```

其餘設定與 [RESTful JAR](./restful-jar.md#2-buildgradlekts) 相同（JDK 17 toolchain）。

## 3. 介面（SEI）

```java title="CompanyWebService.java"
@WebService(targetNamespace = "http://service.other.com", name = "CompanyWebService")
public interface CompanyWebService {

    @WebMethod
    @RequestWrapper(localName = "getCompany", targetNamespace = "http://service.other.com",
                    className = "com.company.dto.GetCompany")
    @ResponseWrapper(localName = "getCompanyResponse", targetNamespace = "http://service.other.com",
                     className = "com.company.dto.GetCompanyResponse")
    @WebResult(name = "companyResponse", targetNamespace = "")
    CompanyResponse getCompany(
        @WebParam(name = "CompanyRequest", targetNamespace = "http://service.other.com") CompanyRequest request)
        throws IOException, SOAPException, TransformerException;
}
```

## 4. 實作類別

```java title="CompanyWebServiceImpl.java"
@WebService(serviceName = "CompanyWebService",
            targetNamespace = "http://service.other.com",
            endpointInterface = "com.company.webservice.CompanyWebService")
public class CompanyWebServiceImpl extends WebserviceBase implements CompanyWebService {

    @Override
    public CompanyResponse getCompany(CompanyRequest request)
            throws IOException, SOAPException, TransformerException {
        // 1. 請求物件 → JSON 字串，作為 condition
        String condition = new ObjectMapper().writeValueAsString(request);

        // 2. 查出完整的 SOAP 回應 XML
        String soapXml = findByPrimaryKey("company", "getCompany", condition, String.class);

        // 3. 擷取 Body 內的 getCompanyResponse 節點並轉回 JAXB 物件
        String body = SoapUtil.getFromSoapXml(soapXml, "ns4:getCompanyResponse");
        GetCompanyResponse response = XmlUtil.xmlToBean(body, GetCompanyResponse.class);
        return response.getCompanyResponse();
    }
}
```

`SoapUtil`、`XmlUtil` 來自 zipe base starter。這個寫法讓維護回應的人可以**直接貼上真實系統的 SOAP 回應**當作 Mock 內容。

:::warning 節點名稱要和回應內容一致
`getFromSoapXml(soapXml, "ns4:getCompanyResponse")` 依「含前綴的節點名稱」擷取。若 Mock 回應的 XML 使用不同的命名空間前綴（例如 `ns2:`），會擷取不到而失敗。可以在 Condition 文件中明確規定前綴，或改寫成不依賴前綴的擷取方式。
:::

## 5. 建立 Endpoint 時的欄位對應

| 欄位 | 值 |
|---|---|
| Publish URI | `company`（與 `findByPrimaryKey` 第一個參數一致） |
| Bean 名稱 | `companyWebServiceImpl`（任意、但需全系統唯一） |
| Class 路徑 | **實作類別** `com.company.webservice.impl.CompanyWebServiceImpl`，不是介面 |

## JAXB 與命名空間注意事項

- 元素的命名空間由 `package-info.java` 的 `@XmlSchema` 與欄位上的 `@XmlElement(namespace = ...)` 共同決定；改動任一個都會讓 WSDL 與對方不一致。
- 若要用 `XmlUtil.xmlToBean`（Jackson XML）把回應 XML 轉回物件，類別上需要同時有 `@JacksonXmlProperty`；`List` 欄位要加 `@JacksonXmlElementWrapper(useWrapping = false)`，可參考範例的 `CompanyResponse.Employees`。
- 系統發布時設定 `JAXBDataBinding` 的 `unwrapJAXBElement=true`、`mtomEnabled=true`，並關閉 JAXB 驗證事件處理（`set-jaxb-validation-event-handler=false`），因此請求中多出的未知元素不會導致錯誤。

## 回傳 SOAP Fault

要模擬錯誤情境，在方法中丟出例外即可，CXF 會轉成 SOAP Fault。例如約定「回應內容以 `FAULT:` 開頭代表錯誤」：

```java
if (soapXml.startsWith("FAULT:")) {
    throw new SOAPFaultException(SOAPFactory.newInstance()
        .createFault(soapXml.substring(6), new QName("http://schemas.xmlsoap.org/soap/envelope/", "Server")));
}
```

下一步：[Condition 設計指南](./condition-design.md)、[打包、上傳與驗證](./build-deploy.md)。
