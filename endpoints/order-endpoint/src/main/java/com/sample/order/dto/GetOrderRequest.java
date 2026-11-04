package com.sample.order.dto;

import jakarta.xml.bind.annotation.XmlAccessType;
import jakarta.xml.bind.annotation.XmlAccessorType;
import jakarta.xml.bind.annotation.XmlRootElement;
import jakarta.xml.bind.annotation.XmlType;

@XmlRootElement(name = "GetOrderRequest")
@XmlAccessorType(XmlAccessType.FIELD)
@XmlType(name = "GetOrderRequest", propOrder = {"orderId"})
public class GetOrderRequest {

    private String orderId;

    public GetOrderRequest() {
    }

    public String getOrderId() {
        return orderId;
    }

    public void setOrderId(String orderId) {
        this.orderId = orderId;
    }
}
