package com.dynamicapi.config;

import com.dynamicapi.dto.ControllerDTO;
import com.dynamicapi.service.DynamicControllerService;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.actuate.endpoint.annotation.Endpoint;
import org.springframework.boot.actuate.endpoint.annotation.ReadOperation;
import org.springframework.stereotype.Component;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.mvc.method.RequestMappingInfo;
import org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerMapping;

import java.util.HashMap;
import java.util.Map;

@Component
@Endpoint(id = "show-mappings")
public class CustomApiMappingsEndpoint {

    private final RequestMappingHandlerMapping handlerMapping;

    private final DynamicControllerService dynamicControllerService;

    public CustomApiMappingsEndpoint(@Qualifier("requestMappingHandlerMapping") RequestMappingHandlerMapping handlerMapping,
                                     DynamicControllerService dynamicControllerService) {
        this.handlerMapping = handlerMapping;
        this.dynamicControllerService = dynamicControllerService;
    }

    @ReadOperation
    public Map<String, String> getApiMappings() {
        Map<String, String> result = new HashMap<>();
        Map<RequestMappingInfo, HandlerMethod> handlerMethods = handlerMapping.getHandlerMethods();
        dynamicControllerService.getControllers().stream().filter(ControllerDTO::getIsActive).forEach(controller -> {
            for (Map.Entry<RequestMappingInfo, HandlerMethod> entry : handlerMethods.entrySet()) {
                RequestMappingInfo mappingInfo = entry.getKey();
                HandlerMethod handlerMethod = entry.getValue();

                if (mappingInfo.getPathPatternsCondition() != null &&
                        mappingInfo.getPathPatternsCondition().getPatterns().stream()
                                .anyMatch(pattern -> pattern.getPatternString().startsWith("/" + controller.getPublishUri()))) {
                    result.put(mappingInfo.toString(), handlerMethod.toString());
                }
            }
        });
        return result;
    }
}
