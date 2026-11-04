package com.sample.order.webservice.impl;

import com.dynamicapi.jarbase.WebserviceBase;
import com.sample.order.dto.GetOrderRequest;
import com.sample.order.dto.GetOrderResponse;
import com.sample.order.dto.GetOrderStatusRequest;
import com.sample.order.dto.GetOrderStatusResponse;
import com.sample.order.webservice.OrderWebService;
import jakarta.jws.WebService;
import jakarta.xml.bind.JAXBContext;
import jakarta.xml.bind.JAXBException;
import jakarta.xml.soap.SOAPException;
import jakarta.xml.soap.SOAPFactory;
import jakarta.xml.ws.WebServiceException;
import jakarta.xml.ws.soap.SOAPFaultException;

import javax.xml.namespace.QName;
import java.io.StringReader;

/**
 * 訂單查詢範例。Mock 回應內容只放回應元素本身的 XML（使用預設 namespace），
 * 例如 {@code <GetOrderResponse xmlns="http://order.sample.com/">...</GetOrderResponse>}。
 * 不加 @Component：WebServiceHandler 會以建立 Endpoint 時填的 Bean 名稱自行註冊。
 */
@WebService(serviceName = "OrderWebService",
        targetNamespace = OrderWebService.NS,
        endpointInterface = "com.sample.order.webservice.OrderWebService")
public class OrderWebServiceImpl extends WebserviceBase implements OrderWebService {

    private static final String PUBLISH_URI = "order";
    private static final String SOAP_ENV_NS = "http://schemas.xmlsoap.org/soap/envelope/";

    @Override
    public GetOrderResponse getOrder(GetOrderRequest request) {
        String orderId = requireOrderId(request == null ? null : request.getOrderId());
        return findMock("getOrder", orderId, GetOrderResponse.class);
    }

    @Override
    public GetOrderStatusResponse getOrderStatus(GetOrderStatusRequest request) {
        String orderId = requireOrderId(request == null ? null : request.getOrderId());
        return findMock("getOrderStatus", orderId, GetOrderStatusResponse.class);
    }

    private String requireOrderId(String orderId) {
        if (orderId == null || orderId.isBlank()) {
            throw fault("Client", "orderId is required");
        }
        return orderId.trim();
    }

    private <T> T findMock(String methodKey, String condition, Class<T> responseType) {
        String key = "publishUri=" + PUBLISH_URI + ", method=" + methodKey + ", condition=" + condition;
        String xml = findByPrimaryKey(PUBLISH_URI, methodKey, condition, String.class);
        // 查無資料時回傳 ""，無法建立實例時回傳 null，兩者都要在轉換前判斷
        if (xml == null || xml.isBlank()) {
            throw fault("Server", "No active mock response: " + key);
        }
        try {
            Object result = JAXBContext.newInstance(responseType)
                    .createUnmarshaller()
                    .unmarshal(new StringReader(xml.trim()));
            return responseType.cast(result);
        } catch (JAXBException | ClassCastException e) {
            throw fault("Server", "Invalid mock response XML: " + key);
        }
    }

    private RuntimeException fault(String code, String message) {
        try {
            return new SOAPFaultException(SOAPFactory.newInstance()
                    .createFault(message, new QName(SOAP_ENV_NS, code)));
        } catch (SOAPException e) {
            return new WebServiceException(message, e);
        }
    }
}
