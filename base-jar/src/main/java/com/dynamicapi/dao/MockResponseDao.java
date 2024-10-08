package com.dynamicapi.dao;

import com.dynamicapi.jdbc.MockResponseJDBC;
import com.zipe.enums.ResourceEnum;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@Component
public class MockResponseDao {

    private final MockResponseJDBC mockResponseJDBC;

    private String serviceType;

    public MockResponseDao(MockResponseJDBC mockResponseJDBC) {
        this.mockResponseJDBC = mockResponseJDBC;
    }

    public <R> R findByPrimaryKey(String publishUri, String method, String condition, Class<R> clazz) {
        ResourceEnum resource = ResourceEnum.SQL.getResource(MockResponseJDBC.SQL_SELECT_RESPONSE_CONTENT);

        Map<String, Object> paramMap = new HashMap<>();
        paramMap.put("publishUri", publishUri);
        paramMap.put("method", method);
        paramMap.put("condition", condition);
        paramMap.put("serviceType", serviceType);

        try {
            return mockResponseJDBC.queryForObject(resource, paramMap, clazz);
        } catch (Exception e) {
            log.error("Unexpected exception querying for object with publishUri: {}, method: {}, condition: {}. Exception: {}",
                    publishUri, method, condition, e.getMessage(), e);
            return null;
        }
    }

    public void setServiceType(String serviceType) {
        this.serviceType = serviceType;
    }
}
