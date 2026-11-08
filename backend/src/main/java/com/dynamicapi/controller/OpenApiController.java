package com.dynamicapi.controller;

import com.dynamicapi.service.OpenApiService;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * 動態 RESTful 服務的 OpenAPI 文件。
 * <p>
 * 刻意不標註 {@code @ResponseResultBody}：Swagger UI 需要最外層就是 OpenAPI 物件，
 * 因此直接回傳文件本身，不包成 {code, message, data}，並以 Cache-Control: no-store 禁止快取。
 */
@RestController
@RequestMapping("/api")
public class OpenApiController {

    private final OpenApiService openApiService;

    public OpenApiController(OpenApiService openApiService) {
        this.openApiService = openApiService;
    }

    @GetMapping(value = "/getOpenApi", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Map<String, Object>> getOpenApi() {
        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .contentType(MediaType.APPLICATION_JSON)
                .body(openApiService.getOpenApi());
    }
}
