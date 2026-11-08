package com.dynamicapi.service;

import java.util.Map;

public interface OpenApiService {

    /**
     * 依目前已啟用、且實際註冊在 requestMappingHandlerMapping 的 RESTful 路由即時產生 OpenAPI 3 文件。
     *
     * @return OpenAPI 文件（最外層含 openapi 欄位）
     */
    Map<String, Object> getOpenApi();
}
