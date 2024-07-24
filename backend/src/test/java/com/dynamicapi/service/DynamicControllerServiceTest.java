package com.dynamicapi.service;

import com.dynamicapi.base.TestBase;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

public class DynamicControllerServiceTest extends TestBase {

    @Autowired
    public DynamicControllerService dynamicControllerService;

    @Test
    void testGetController() {
        dynamicControllerService.getController("example");
    }
}
