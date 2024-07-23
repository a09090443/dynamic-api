package com.dynamicapi.dto;

import lombok.Data;

@Data
public class MockResponseRequestDTO {

    private String id;

    private String publishUri;

    private String method;

    private String condition;

    private String responseContent;

    private Boolean status;
}
