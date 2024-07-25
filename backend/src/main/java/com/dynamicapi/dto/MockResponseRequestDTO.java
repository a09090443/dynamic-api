package com.dynamicapi.dto;

import com.dynamicapi.enums.ServiceType;
import lombok.Data;

@Data
public class MockResponseRequestDTO {

    private String id;

    private String publishUri;

    private String method;

    private String condition;

    private String responseContent;

    private ServiceType serviceType;

    private Boolean status;
}
