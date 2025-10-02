package com.dynamicapi.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ViewControllerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${server.servlet.context-path}")
    private String contextPath;

    @Override
    public void addViewControllers(ViewControllerRegistry registry) {
        // 首頁路由：/ → index.html
        // 註：其他 SPA 路由由 SpaController 處理
        registry.addViewController(contextPath + "/").setViewName("forward:/index.html");
        
        // 設置優先級
        registry.setOrder(Ordered.HIGHEST_PRECEDENCE);
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        // 添加 CORS 配置以支持 npm dev 開發模式
        registry.addMapping("/**")
                .allowedOrigins("http://localhost:3000")  // 允許來自 npm dev 的請求
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH")
                .allowedHeaders("*")
                .allowCredentials(true)
                .maxAge(3600);  // 預檢請求的快取時間（秒）
    }
}
