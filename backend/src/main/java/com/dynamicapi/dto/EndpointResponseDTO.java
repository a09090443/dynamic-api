package com.dynamicapi.dto;

import lombok.Data;

@Data
public class EndpointResponseDTO {
    public String id;
    public String publishUri;
    public String beanName;
    public String classPath;
    public Boolean isActive;
    public String jarFileId;
    public String jarFileName;
    public String fileStatus;
}
