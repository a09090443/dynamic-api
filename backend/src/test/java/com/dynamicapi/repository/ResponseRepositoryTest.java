package com.dynamicapi.repository;

import com.dynamicapi.dao.MockResponseDao;
import com.dynamicapi.jarbase.TestBase;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

class ResponseRepositoryTest extends TestBase {

    @Autowired
    public MockResponseDao mockResponseDao;

    @Test
    void testFindByCondition() {
        String content = mockResponseDao.findByPrimaryKey("company", "getCompany", "{\"employees\":null,\"name\":\"Gay\",\"taxId\":\"123456789\"}", String.class);
        System.out.println(content);
//        Assertions.assertEquals(mockResponseXml(), content);
    }

    private String requestJson() {
        return """
                {"employees":null,"name":"Gary","taxId":"123456789"}
                """;
    }

}
