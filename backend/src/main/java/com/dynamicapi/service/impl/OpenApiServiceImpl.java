package com.dynamicapi.service.impl;

import com.dynamicapi.entity.ControllerEntity;
import com.dynamicapi.enums.ClassLoaderSingletonEnum;
import com.dynamicapi.repository.ControllerRepository;
import com.dynamicapi.service.OpenApiService;
import com.dynamicapi.util.OpenApiGenerator;
import com.zipe.util.classloader.CustomClassLoader;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerMapping;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * 每次請求即時產生 OpenAPI；不快取任何結果，也不保留使用者 JAR 的型別或 ClassLoader。
 */
@Service
public class OpenApiServiceImpl implements OpenApiService {

    /** 與 DynamicControllerServiceImpl 相同的 ClassLoader 登錄鍵後綴：{publishUri}_controller */
    private static final String CONTROLLER_KEY_SUFFIX = "_controller";

    private final ControllerRepository controllerRepository;

    private final RequestMappingHandlerMapping requestMappingHandlerMapping;

    private final String contextPath;

    public OpenApiServiceImpl(ControllerRepository controllerRepository,
                              @Qualifier("requestMappingHandlerMapping") RequestMappingHandlerMapping requestMappingHandlerMapping,
                              @Value("${server.servlet.context-path:}") String contextPath) {
        this.controllerRepository = controllerRepository;
        this.requestMappingHandlerMapping = requestMappingHandlerMapping;
        this.contextPath = contextPath;
    }

    @Override
    public Map<String, Object> getOpenApi() {
        // 區域變數：請求結束即釋放，不延長使用者 ClassLoader 的生命週期
        Map<String, CustomClassLoader> serviceLoaders = new LinkedHashMap<>();
        for (ControllerEntity controller : controllerRepository.findAllByIsActive(Boolean.TRUE)) {
            CustomClassLoader classLoader = ClassLoaderSingletonEnum.INSTANCE.get(controller.getPublishUri() + CONTROLLER_KEY_SUFFIX);
            if (classLoader != null) {
                serviceLoaders.put(controller.getPublishUri(), classLoader);
            }
        }
        return OpenApiGenerator.generate(contextPath, serviceLoaders, requestMappingHandlerMapping.getHandlerMethods());
    }
}
