package com.dynamicapi.service;

import com.dynamicapi.dto.EndpointDTO;
import com.dynamicapi.enums.JarFileStatus;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.List;

public interface DynamicWebService {
    List<EndpointDTO> getEndpoints();

    EndpointDTO getEndpoint(String id, String publishUri);

    void saveWebService(EndpointDTO endpointDTO);

    void updateWebService(EndpointDTO endpointDTO);

    void enabledWebService(String publishUri);

    EndpointDTO disabledWebService(EndpointDTO endpointDTO);

    void updateJarFileStatus(String fileId, JarFileStatus status);

    void removeWebService(String publishUri, String jarFileId);

    byte[] generateWsdlToObjects(String wsdlUrl, MultipartFile wsdlFile, String packageName);
}
