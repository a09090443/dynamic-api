package com.dynamicapi.jarbase;

import com.dynamicapi.dao.MockResponseDao;
import org.springframework.beans.factory.annotation.Autowired;

public abstract class RestfulBase {
    protected MockResponseDao mockResponseDao;
    public final String serviceType = "RESTFUL";

    @Autowired
    public final void setMockResponseDao(MockResponseDao mockResponseDao) {
        this.mockResponseDao = mockResponseDao;
        this.mockResponseDao.setServiceType(serviceType);
    }
}
