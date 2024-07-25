package com.dynamicapi.jarbase;

import com.dynamicapi.dao.MockResponseDao;
import org.springframework.beans.factory.annotation.Autowired;

public abstract class WebserviceBase {
    protected MockResponseDao mockResponseDao;
    public final String serviceType = "ENDPOINT";

    @Autowired
    public final void setMockResponseDao(MockResponseDao mockResponseDao) {
        this.mockResponseDao = mockResponseDao;
        this.mockResponseDao.setServiceType(serviceType);
    }
}
