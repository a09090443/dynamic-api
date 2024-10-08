package com.dynamicapi.service.impl;

import com.dynamicapi.dto.JarFileResponseDTO;
import com.dynamicapi.dto.MockResponseRequestDTO;
import com.dynamicapi.dto.MockResponseResponseDTO;
import com.dynamicapi.entity.JarFileEntity;
import com.dynamicapi.entity.MockResponseEntity;
import com.dynamicapi.enums.JarFileStatus;
import com.dynamicapi.exception.WebserviceException;
import com.dynamicapi.jdbc.MockResponseJDBC;
import com.dynamicapi.repository.JarFileRepository;
import com.dynamicapi.repository.MockResponseRepository;
import com.dynamicapi.service.CommonService;
import com.zipe.enums.ResourceEnum;
import com.zipe.util.time.DateTimeUtils;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang.StringUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.IncorrectResultSizeDataAccessException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
public class CommonServiceImpl implements CommonService {

    private final String jarFileDir;

    private final JarFileRepository jarFileRepository;

    private final MockResponseRepository mockResponseRepository;

    private final MockResponseJDBC mockResponseJDBC;

    public CommonServiceImpl(@Value("${jar.file.dir}") String jarFileDir,
                             JarFileRepository jarFileRepository,
                             MockResponseRepository mockResponseRepository,
                             MockResponseJDBC mockResponseJDBC) {
        this.jarFileDir = jarFileDir;
        this.jarFileRepository = jarFileRepository;
        this.mockResponseRepository = mockResponseRepository;
        this.mockResponseJDBC = mockResponseJDBC;
    }

    @Transactional(rollbackFor = Exception.class)
    @Override
    public JarFileResponseDTO uploadJarFile(InputStream inputStream) throws IOException {
        // 確保上傳目錄存在
        Path uploadPath = Paths.get(jarFileDir);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        String newFileName = UUID.randomUUID() + ".jar";
        // 儲存檔案到本地檔案系統
        Path filePath = uploadPath.resolve(newFileName);
        Files.copy(inputStream, filePath, StandardCopyOption.REPLACE_EXISTING);

        JarFileEntity jarFileEntity = new JarFileEntity();
        jarFileEntity.setName(newFileName);
        jarFileEntity.setStatus(JarFileStatus.INACTIVE);
        jarFileEntity = jarFileRepository.save(jarFileEntity);

        JarFileResponseDTO jarFileResponse = new JarFileResponseDTO();
        jarFileResponse.setJarFileId(jarFileEntity.getId());
        jarFileResponse.setJarFileName(jarFileEntity.getName());
        return jarFileResponse;
    }

    @Override
    public String getResponseContent(MockResponseRequestDTO request) {

        if (StringUtils.isBlank(request.getPublishUri())) {
            throw new WebserviceException("Publish URL is required");
        } else if (StringUtils.isBlank(request.getMethod())) {
            throw new WebserviceException("Method is required");
        } else if (StringUtils.isBlank(request.getCondition())) {
            throw new WebserviceException("Condition is required");
        }
        MockResponseEntity mockResponseEntity = mockResponseRepository.findByIdPublishUriAndIdMethodAndIdConditionAndIsActiveAndIdServiceType(request.getPublishUri(), request.getMethod(), request.getCondition(), Boolean.TRUE, request.getServiceType());
        return Optional.ofNullable(mockResponseEntity).map(MockResponseEntity::getResponseContent).orElse("");
    }

    @Override
    public List<MockResponseResponseDTO> getResponseList(MockResponseRequestDTO request) {
        if (StringUtils.isBlank(request.getPublishUri())) {
            throw new WebserviceException("Publish URL is required");
        }
        List<MockResponseEntity> mockResponseEntity = mockResponseRepository.findByIdPublishUriAndIdServiceType(request.getPublishUri(), request.getServiceType());
        return mockResponseEntity.stream().map(mockResponse -> {
            MockResponseResponseDTO response = new MockResponseResponseDTO();
            response.setId(mockResponse.getUuId());
            response.setPublishUri(mockResponse.getId().getPublishUri());
            response.setMethod(mockResponse.getId().getMethod());
            response.setCondition(mockResponse.getId().getCondition());
            response.setResponseContent(mockResponse.getResponseContent());
            response.setIsActive(mockResponse.getIsActive());
            return response;
        }).toList();
    }

    @Transactional(rollbackFor = Exception.class)
    @Override
    public void saveMockResponse(MockResponseRequestDTO request) {
        MockResponseEntity mockResponseEntity = new MockResponseEntity();
        mockResponseEntity.setUuId(UUID.randomUUID().toString());
        mockResponseEntity.getId().setPublishUri(request.getPublishUri());
        mockResponseEntity.getId().setMethod(request.getMethod());
        mockResponseEntity.getId().setCondition(request.getCondition());
        mockResponseEntity.getId().setServiceType(request.getServiceType());
        mockResponseEntity.setResponseContent(request.getResponseContent());
        mockResponseEntity.setIsActive(Boolean.FALSE);
        mockResponseRepository.save(mockResponseEntity);
        request.setId(mockResponseEntity.getUuId());
    }

    @Transactional(rollbackFor = Exception.class)
    @Override
    public void updateMockResponse(MockResponseRequestDTO request) {
        ResourceEnum resource = ResourceEnum.SQL.getResource(MockResponseJDBC.SQL_UPDATE_RESPONSE);

        Map<String, Object> paramMap = new HashMap<>();
        paramMap.put("publishUri", request.getPublishUri());
        paramMap.put("method", request.getMethod());
        paramMap.put("condition", request.getCondition());
        paramMap.put("responseContent", request.getResponseContent());
        paramMap.put("id", request.getId());
        paramMap.put("updatedAt", DateTimeUtils.getDateNow());
        try {
            mockResponseJDBC.update(resource, paramMap);
        } catch (IncorrectResultSizeDataAccessException e) {
            log.error("publishUri:{}", request.getPublishUri());
            log.error("method:{}", request.getMethod());
            log.error("condition:{}", request.getCondition());
            log.error("responseContent:{}", request.getResponseContent());
            throw new WebserviceException("更新 Mock Response 失敗");
        }
    }

    @Transactional(rollbackFor = Exception.class)
    @Override
    public void updateMockResponse(String oriPublishUri, String newPublishUri) {
        ResourceEnum resource = ResourceEnum.SQL.getResource(MockResponseJDBC.SQL_UPDATE_PUBLISH_URI_FOR_RESPONSE);
        Map<String, Object> paramMap = new HashMap<>();
        paramMap.put("oriPublishUri", oriPublishUri);
        paramMap.put("newPublishUri", newPublishUri);
        paramMap.put("updatedAt", DateTimeUtils.getDateNow());
        try {
            mockResponseJDBC.update(resource, paramMap);
        } catch (IncorrectResultSizeDataAccessException e) {
            log.error("oriPublishUri:{}", oriPublishUri);
            log.error("newPublishUri:{}", newPublishUri);
            log.error("IncorrectResultSizeDataAccessException:{}", e.getMessage(), e);
            throw new WebserviceException("更新 Mock Response 失敗");
        }
    }

    @Transactional(rollbackFor = Exception.class)
    @Override
    public void deleteMockResponse(String id) {
        ResourceEnum resource = ResourceEnum.SQL.getResource(MockResponseJDBC.SQL_DEL_RESPONSE);
        Map<String, Object> paramMap = new HashMap<>();
        paramMap.put("id", id);
        try {
            mockResponseJDBC.update(resource, paramMap);
        } catch (IncorrectResultSizeDataAccessException e) {
            log.error("id:{}", id);
            log.error("IncorrectResultSizeDataAccessException:{}", e.getMessage(), e);
            throw new WebserviceException("刪除 Mock Response 失敗");
        }
    }

    @Transactional(rollbackFor = Exception.class)
    @Override
    public void switchMockResponse(String id, Boolean status) {
        MockResponseEntity mockResponseEntity = mockResponseRepository.findByUuId(id);
        mockResponseEntity.setIsActive(status);
        try {
            mockResponseRepository.save(mockResponseEntity);
        } catch (Exception e) {
            throw new WebserviceException("切換 Mock Response 狀態失敗");
        }
    }

}
