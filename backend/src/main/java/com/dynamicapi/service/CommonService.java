package com.dynamicapi.service;

import com.dynamicapi.dto.JarFileResponseDTO;
import com.dynamicapi.dto.MockResponseRequestDTO;
import com.dynamicapi.dto.MockResponseResponseDTO;

import java.io.IOException;
import java.io.InputStream;
import java.util.List;

public interface CommonService {
    JarFileResponseDTO uploadJarFile(InputStream inputStream) throws IOException;

    String getResponseContent(MockResponseRequestDTO request);

    List<MockResponseResponseDTO> getResponseList(MockResponseRequestDTO request);

    void saveMockResponse(MockResponseRequestDTO request);

    void updateMockResponse(MockResponseRequestDTO request);

    void updateMockResponse(String oriPublishUri, String newPublishUri);

    void deleteMockResponse(String id);

    void switchMockResponse(String id, Boolean status);
}
