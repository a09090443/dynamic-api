package com.sample.order.webservice;

import com.sample.order.dto.GetOrderRequest;
import com.sample.order.dto.GetOrderResponse;
import com.sample.order.dto.GetOrderStatusRequest;
import com.sample.order.dto.GetOrderStatusResponse;
import jakarta.jws.WebMethod;
import jakarta.jws.WebParam;
import jakarta.jws.WebResult;
import jakarta.jws.WebService;
import jakarta.jws.soap.SOAPBinding;

/**
 * 訂單查詢服務介面（SEI）。document/literal BARE：Body 內直接是請求／回應元素。
 */
@WebService(name = "OrderWebService", targetNamespace = OrderWebService.NS)
@SOAPBinding(parameterStyle = SOAPBinding.ParameterStyle.BARE)
public interface OrderWebService {

    String NS = "http://order.sample.com/";

    @WebMethod
    @WebResult(name = "GetOrderResponse", targetNamespace = NS, partName = "parameters")
    GetOrderResponse getOrder(
            @WebParam(name = "GetOrderRequest", targetNamespace = NS, partName = "parameters") GetOrderRequest request);

    @WebMethod
    @WebResult(name = "GetOrderStatusResponse", targetNamespace = NS, partName = "parameters")
    GetOrderStatusResponse getOrderStatus(
            @WebParam(name = "GetOrderStatusRequest", targetNamespace = NS, partName = "parameters") GetOrderStatusRequest request);
}
