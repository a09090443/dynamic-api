package com.dynamicapi.service;

import com.dynamicapi.dto.EndpointDTO;

import java.util.List;

public interface DynamicWebService {
    List<EndpointDTO> getEndpoints();

    EndpointDTO getEndpoint(String id);

    void saveWebService(EndpointDTO endpointDTO);

    void updateWebService(EndpointDTO endpointDTO);

    void enabledWebService(String publishUri);

    void disabledWebService(String publicUri, Boolean isDeleted);

    void disabledJarFile(String publishUri);

    void removeWebService(String publishUri);
}
