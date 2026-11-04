package com.sample.order.dto;

import jakarta.xml.bind.annotation.XmlAccessType;
import jakarta.xml.bind.annotation.XmlAccessorType;
import jakarta.xml.bind.annotation.XmlRootElement;
import jakarta.xml.bind.annotation.XmlType;

@XmlRootElement(name = "GetOrderStatusRequest")
@XmlAccessorType(XmlAccessType.FIELD)
@XmlType(name = "GetOrderStatusRequest", propOrder = {"orderId"})
public class GetOrderStatusRequest {

    private String orderId;

    public GetOrderStatusRequest() {
    }

    public String getOrderId() {
        return orderId;
    }

    public void setOrderId(String orderId) {
        this.orderId = orderId;
    }
}
