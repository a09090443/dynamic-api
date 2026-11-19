package com.dynamicapi.config;

import org.junit.jupiter.api.io.TempDir;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.io.IOException;
import java.net.URL;
import java.net.URLClassLoader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * SpaController 讀取靜態頁的三種情況：只有 &lt;page&gt;.html、只有 &lt;page&gt;/index.html、兩者都沒有。
 * 以隔離的 ClassLoader（parent 為 null）指向暫存目錄，不受 src/main/resources/static 實際內容影響。
 */
class SpaControllerTest {

    @TempDir
    Path classpathRoot;

    private MockMvc mockMvc(Path root) throws IOException {
        ClassLoader loader = new URLClassLoader(new URL[]{root.toUri().toURL()}, null);
        return MockMvcBuilders.standaloneSetup(new SpaController(loader)).build();
    }

    private void write(String relative, String body) throws IOException {
        Path file = classpathRoot.resolve(relative);
        Files.createDirectories(file.getParent());
        Files.writeString(file, body, StandardCharsets.UTF_8);
    }

    /**
     * DispatcherServlet 對應 "/" 時，servletPath 即為完整路徑（不含 context-path，保留結尾斜線）。
     * MockMvc 的 servletPath() 不接受結尾斜線，所以在建好請求後直接設定。
     */
    private static org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder page(String path) {
        return get(path).accept(MediaType.TEXT_HTML).with(request -> {
            request.setServletPath(path);
            request.setPathInfo(null);
            return request;
        });
    }

    @ParameterizedTest
    @ValueSource(strings = {"/wsdl", "/wsdl/"})
    void servesFlatHtmlWhenOnlyPageHtmlExists(String path) throws Exception {
        write("static/wsdl.html", "<html>flat wsdl</html>");

        mockMvc(classpathRoot).perform(page(path))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.TEXT_HTML))
                .andExpect(content().string(containsString("flat wsdl")));
    }

    @ParameterizedTest
    @ValueSource(strings = {"/wsdl", "/wsdl/"})
    void fallsBackToIndexHtmlWhenOnlyDirectoryExportExists(String path) throws Exception {
        write("static/wsdl/index.html", "<html>index wsdl</html>");

        mockMvc(classpathRoot).perform(page(path))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.TEXT_HTML))
                .andExpect(content().string(containsString("index wsdl")));
    }

    @ParameterizedTest
    @ValueSource(strings = {"/wsdl", "/wsdl/"})
    void prefersPageHtmlWhenBothExist(String path) throws Exception {
        write("static/wsdl.html", "<html>flat wsdl</html>");
        write("static/wsdl/index.html", "<html>index wsdl</html>");

        mockMvc(classpathRoot).perform(page(path))
                .andExpect(status().isOk())
                .andExpect(content().string(containsString("flat wsdl")))
                .andExpect(content().string(not(containsString("index wsdl"))));
    }

    @ParameterizedTest
    @ValueSource(strings = {"/wsdl", "/wsdl/"})
    void returns404WhenNeitherExists(String path) throws Exception {
        // 放一個其他頁，確認不會誤用別頁內容
        write("static/endpoint.html", "<html>endpoint</html>");

        mockMvc(classpathRoot).perform(page(path))
                .andExpect(status().isNotFound())
                .andExpect(content().string(containsString("404")));
    }
}
