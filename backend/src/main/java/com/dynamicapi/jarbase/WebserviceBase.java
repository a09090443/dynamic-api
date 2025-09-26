package com.dynamicapi.jarbase;

import com.dynamicapi.dao.MockResponseDao;
import com.dynamicapi.enums.ServiceType;
import org.springframework.beans.factory.annotation.Autowired;

public abstract class WebserviceBase {
    protected MockResponseDao mockResponseDao;

    @Autowired
    public final void setMockResponseDao(MockResponseDao mockResponseDao) {
        this.mockResponseDao = mockResponseDao;
    }

    protected <T> T findByPrimaryKey(String publishUri, String method, String condition, Class<T> clazz){
        return mockResponseDao.findByPrimaryKey(publishUri, method, condition, ServiceType.ENDPOINT, clazz);
    }
}
