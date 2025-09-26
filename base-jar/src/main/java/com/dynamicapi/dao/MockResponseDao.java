package com.dynamicapi.dao;

import com.dynamicapi.enums.ServiceType;
import com.dynamicapi.jdbc.MockResponseJDBC;
import com.zipe.enums.ResourceEnum;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.stereotype.Component;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Component
public class MockResponseDao {

    private final MockResponseJDBC mockResponseJDBC;

    private final ResourceLoader resourceLoader;

    public MockResponseDao(MockResponseJDBC mockResponseJDBC, ResourceLoader resourceLoader) {
        this.mockResponseJDBC = mockResponseJDBC;
        this.resourceLoader = resourceLoader;
    }

    public <R> R findByPrimaryKey(String publishUri, String method, String condition, ServiceType serviceType, Class<R> clazz) {
        ResourceEnum resource = ResourceEnum.SQL.getResource(MockResponseJDBC.SQL_SELECT_RESPONSE_CONTENT);
        String sql = readFileFromJar(resource);

        Map<String, Object> paramMap = new HashMap<>();
        paramMap.put("publishUri", publishUri);
        paramMap.put("method", method);
        paramMap.put("condition", condition);
        paramMap.put("serviceType", serviceType.name());

        try {
            return mockResponseJDBC.queryForObject(sql, paramMap, clazz);
        } catch (Exception e) {
            log.error("Unexpected exception querying for object with publishUri: {}, method: {}, condition: {}. Exception: {}",
                    publishUri, method, condition, e.getMessage(), e);
            // 在這裡創建並返回一個 R 類型的對象
            try {
                return clazz.getDeclaredConstructor().newInstance();
            } catch (Exception ex) {
                log.error("Failed to create instance of {}: {}", clazz.getName(), ex.getMessage(), ex);
                return null;
            }
        }
    }

    private String readFileFromJar(ResourceEnum resource) {
        StringBuilder path = new StringBuilder();
        path.append(resource.dir());
        path.append(resource.file());
        path.append(resource.extension());
        try {
            // 使用 classpath: 前綴來指定文件在 JAR 內的路徑
            Resource fileResource = resourceLoader.getResource("classpath:" + path.toString());

            // 檢查資源是否存在
            if (!fileResource.exists()) {
                throw new RuntimeException("File not found: " + path.toString());
            }

            // 讀取文件內容
            try (BufferedReader reader = new BufferedReader(
                    new InputStreamReader(fileResource.getInputStream(), StandardCharsets.UTF_8))) {
                return reader.lines().collect(Collectors.joining("\n"));
            }
        } catch (Exception e) {
            throw new RuntimeException("Error reading file from JAR: " + path.toString(), e);
        }
    }
}
