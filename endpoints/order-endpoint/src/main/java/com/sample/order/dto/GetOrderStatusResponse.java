package com.sample.order.dto;

import jakarta.xml.bind.annotation.XmlAccessType;
import jakarta.xml.bind.annotation.XmlAccessorType;
import jakarta.xml.bind.annotation.XmlRootElement;
import jakarta.xml.bind.annotation.XmlType;

@XmlRootElement(name = "GetOrderStatusResponse")
@XmlAccessorType(XmlAccessType.FIELD)
@XmlType(name = "GetOrderStatusResponse", propOrder = {"orderId", "status", "updatedAt"})
public class GetOrderStatusResponse {

    private String orderId;
    private String status;
    private String updatedAt;

    public GetOrderStatusResponse() {
    }

    public String getOrderId() {
        return orderId;
    }

    public void setOrderId(String orderId) {
        this.orderId = orderId;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(String updatedAt) {
        this.updatedAt = updatedAt;
    }
}
