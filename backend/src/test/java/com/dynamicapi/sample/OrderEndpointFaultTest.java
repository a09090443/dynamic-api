package com.dynamicapi.sample;

import com.dynamicapi.dao.MockResponseDao;
import com.dynamicapi.enums.ServiceType;
import jakarta.xml.ws.soap.SOAPFaultException;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.io.TempDir;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

import javax.tools.DiagnosticCollector;
import javax.tools.JavaCompiler;
import javax.tools.JavaFileObject;
import javax.tools.StandardJavaFileManager;
import javax.tools.ToolProvider;
import java.io.File;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.net.URL;
import java.net.URLClassLoader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.catchThrowable;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoMoreInteractions;
import static org.mockito.Mockito.when;

/**
 * 以後端 test classpath 編譯 endpoints/order-endpoint 原始碼，驗證查無 Mock（null／空字串／純空白）時
 * 兩個 operation 都在 JAXB 轉換前回傳含識別資訊的 Server SOAP Fault。不啟動 Spring、不連 SQLite。
 */
class OrderEndpointFaultTest {

    private static final String IMPL = "com.sample.order.webservice.impl.OrderWebServiceImpl";
    private static final String DTO_PKG = "com.sample.order.dto.";

    @TempDir
    static Path classesDir;

    private static URLClassLoader loader;

    @BeforeAll
    static void compileOrderEndpoint() throws Exception {
        Path srcRoot = Paths.get("..", "endpoints", "order-endpoint", "src", "main", "java").toAbsolutePath().normalize();
        assertTrue(Files.isDirectory(srcRoot), "order-endpoint source not found: " + srcRoot);
        List<File> sources;
        try (Stream<Path> walk = Files.walk(srcRoot)) {
            sources = walk.filter(p -> p.toString().endsWith(".java")).map(Path::toFile).toList();
        }
        assertThat(sources).isNotEmpty();

        JavaCompiler compiler = ToolProvider.getSystemJavaCompiler();
        assertNotNull(compiler, "JDK compiler is not available");
        DiagnosticCollector<JavaFileObject> diagnostics = new DiagnosticCollector<>();
        try (StandardJavaFileManager fm = compiler.getStandardFileManager(diagnostics, null, StandardCharsets.UTF_8)) {
            List<String> options = List.of(
                    "-classpath", System.getProperty("java.class.path"),
                    "-d", classesDir.toString(),
                    "--release", "17",
                    "-encoding", "UTF-8");
            Boolean ok = compiler.getTask(null, fm, diagnostics, options, null,
                    fm.getJavaFileObjectsFromFiles(sources)).call();
            assertTrue(Boolean.TRUE.equals(ok), "order-endpoint compilation failed: " + diagnostics.getDiagnostics());
        }
        // 父優先：WebserviceBase、MockResponseDao、SOAPFaultException 與測試共用同一份類別（同後端執行期行為）
        loader = new URLClassLoader(new URL[]{classesDir.toUri().toURL()}, OrderEndpointFaultTest.class.getClassLoader());
    }

    @AfterAll
    static void closeLoader() throws Exception {
        if (loader != null) {
            loader.close();
        }
    }

    static Stream<Arguments> missingMocks() {
        return Stream.of(
                Arguments.of("getOrder", "GetOrderRequest", null),
                Arguments.of("getOrder", "GetOrderRequest", ""),
                Arguments.of("getOrder", "GetOrderRequest", "   "),
                Arguments.of("getOrderStatus", "GetOrderStatusRequest", null),
                Arguments.of("getOrderStatus", "GetOrderStatusRequest", ""),
                Arguments.of("getOrderStatus", "GetOrderStatusRequest", "   "));
    }

    @ParameterizedTest(name = "{0} with mock content [{2}] -> Server SOAP Fault")
    @MethodSource("missingMocks")
    void missingMockReturnsServerFault(String operation, String requestType, String mockContent) throws Exception {
        MockResponseDao dao = mock(MockResponseDao.class);
        when(dao.findByPrimaryKey("order", operation, "A001", ServiceType.ENDPOINT, String.class)).thenReturn(mockContent);

        Class<?> implClass = loader.loadClass(IMPL);
        Object service = implClass.getDeclaredConstructor().newInstance();
        implClass.getMethod("setMockResponseDao", MockResponseDao.class).invoke(service, dao);

        Class<?> requestClass = loader.loadClass(DTO_PKG + requestType);
        Object request = requestClass.getDeclaredConstructor().newInstance();
        requestClass.getMethod("setOrderId", String.class).invoke(request, " A001 ");

        Method op = implClass.getMethod(operation, requestClass);
        Throwable thrown = catchThrowable(() -> op.invoke(service, request));

        assertThat(thrown).isInstanceOf(InvocationTargetException.class);
        Throwable cause = thrown.getCause();
        assertThat(cause).isInstanceOf(SOAPFaultException.class);
        SOAPFaultException fault = (SOAPFaultException) cause;
        assertThat(fault.getFault().getFaultCodeAsQName().getLocalPart()).isEqualTo("Server");
        assertThat(fault.getFault().getFaultString())
                .isEqualTo("No active mock response: publishUri=order, method=" + operation + ", condition=A001");
        assertThat(fault.getMessage())
                .contains("publishUri=order")
                .contains("method=" + operation)
                .contains("condition=A001");

        verify(dao).findByPrimaryKey("order", operation, "A001", ServiceType.ENDPOINT, String.class);
        verifyNoMoreInteractions(dao);
    }
}
