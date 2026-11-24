package com.dynamicapi.jdbc;

import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 依名稱讀取 {@code classpath:sql/{名稱}.sql} 的具名 SQL，結果以 {@link ConcurrentHashMap} 快取。
 * <p>
 * 取代 zipe 的 {@code ResourceEnum} 具名 SQL 讀取方式：該 enum 常數在 JVM 中只有一份，
 * 呼叫時會把檔名寫進共用狀態，並行請求會讀到別人的 SQL（issue #19）。
 * 本類別不保存任何呼叫端狀態，回傳的 SQL 字串不可變，可安全地由多執行緒共用。
 */
@Component
public class NamedSqlLoader {

    private static final String SQL_DIR = "classpath:sql/";

    private static final String SQL_EXTENSION = ".sql";

    private final ResourceLoader resourceLoader;

    private final Map<String, String> cache = new ConcurrentHashMap<>();

    public NamedSqlLoader(ResourceLoader resourceLoader) {
        this.resourceLoader = resourceLoader;
    }

    /**
     * 取得具名 SQL 的文字。
     *
     * @param name SQL 名稱，等於 {@code *JDBC} 類別中的常數值
     * @return SQL 文字
     * @throws IllegalStateException 找不到對應的 SQL 檔
     */
    public String get(String name) {
        return cache.computeIfAbsent(name, this::load);
    }

    private String load(String name) {
        String location = SQL_DIR + name + SQL_EXTENSION;
        Resource resource = resourceLoader.getResource(location);
        if (!resource.exists()) {
            throw new IllegalStateException("找不到具名 SQL：" + name + "（" + location + "）");
        }
        try (InputStream in = resource.getInputStream()) {
            return new String(in.readAllBytes(), StandardCharsets.UTF_8);
        } catch (IOException e) {
            throw new UncheckedIOException("讀取具名 SQL 失敗：" + name + "（" + location + "）", e);
        }
    }
}
