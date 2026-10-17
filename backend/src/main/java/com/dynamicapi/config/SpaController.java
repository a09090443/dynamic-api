package com.dynamicapi.config;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.util.StreamUtils;
import org.springframework.web.bind.annotation.GetMapping;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

/**
 * SPA (Single Page Application) 路由處理控制器
 * 
 * 處理 Next.js 靜態導出的頁面路由，支援帶和不帶尾隨斜線的 URL
 */
@Controller
public class SpaController {

    /**
     * 處理所有 SPA 路由，返回對應的 HTML 頁面
     * 
     * 支援的路由：
     * - /endpoint, /endpoint/
     * - /restful, /restful/
     * - /response, /response/
     * - /test-api, /test-api/
     * - /about, /about/
     */
    @GetMapping(value = {
            "/endpoint", "/endpoint/",
            "/restful", "/restful/",
            "/response", "/response/",
            "/test-api", "/test-api/",
            "/about", "/about/"
    }, produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> handleSpaRoutes(HttpServletRequest request) {
        try {
            // 獲取請求路徑
            String path = request.getServletPath();
            
            // 移除尾隨斜線
            if (path.endsWith("/") && path.length() > 1) {
                path = path.substring(0, path.length() - 1);
            }
            
            // 構建 HTML 文件路徑（相對於 classpath:/static/）
            String htmlPath = "static" + path + ".html";
            
            // 載入資源
            Resource resource = new ClassPathResource(htmlPath);
            
            if (resource.exists() && resource.isReadable()) {
                // 讀取 HTML 內容
                try (InputStream inputStream = resource.getInputStream()) {
                    String html = StreamUtils.copyToString(inputStream, StandardCharsets.UTF_8);
                    return ResponseEntity.ok()
                            .contentType(MediaType.TEXT_HTML)
                            .body(html);
                }
            } else {
                // 資源不存在
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body("<html><body><h1>404 - Page Not Found</h1><p>Resource: " + htmlPath + "</p></body></html>");
            }
            
        } catch (IOException e) {
            // 讀取失敗
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("<html><body><h1>500 - Internal Server Error</h1><p>" + e.getMessage() + "</p></body></html>");
        }
    }
}
