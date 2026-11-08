package com.dynamicapi.service;

import com.dynamicapi.service.OpenApiGeneratorTest.Deep1;
import com.dynamicapi.service.OpenApiGeneratorTest.OrderDto;
import com.dynamicapi.service.OpenApiGeneratorTest.SelfNode;
import com.dynamicapi.service.OpenApiGeneratorTest.TypeA;
import com.dynamicapi.util.OpenApiGenerator;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.mvc.method.RequestMappingInfo;
import org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerMapping;

import java.io.IOException;
import java.io.InputStream;
import java.lang.reflect.Constructor;
import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.startsWith;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * OpenAPI 產生器情境測試。
 * <p>
 * 以實際的 {@link RequestMappingHandlerMapping#registerMapping} 註冊路由，並用不同的 ClassLoader 載入 fixture controller，
 * 模擬每個 RESTful 服務各自一個 CustomClassLoader 的執行期狀態；不依賴 SQLite。
 * 最後的 {@link HttpContract} 以完整 Spring 環境（含 zipe 的回應包裝 Advice）驗證 HTTP 契約。
 */
// public：fixture 由另一個 ClassLoader 定義（不同 runtime package），需要能存取外層類別
public class OpenApiGeneratorTest {

    private static final String PREFIX = OpenApiGeneratorTest.class.getPackageName() + ".OpenApiFixture";

    private RequestMappingHandlerMapping mapping;

    @BeforeEach
    void setUp() {
        mapping = new RequestMappingHandlerMapping();
    }

    // ---------------------------------------------------------------- 基本文件與空狀態

    @Test
    void emptyStateProducesValidDocumentWithEmptyPaths() {
        // 系統自身的 controller（應用程式 ClassLoader）已註冊，但沒有任何已啟用的動態服務
        register(mapping, SystemController.class, new SystemController());

        Map<String, Object> doc = assertGeneratesWithoutException(Map.of());

        assertThat((String) doc.get("openapi")).startsWith("3.");
        assertThat(doc).containsKeys("info", "paths", "servers");
        assertThat(asMap(doc.get("info"))).containsKeys("title", "version");
        assertThat(asMap(doc.get("paths"))).isEmpty();
        assertThat(asMap(asList(doc.get("servers")).get(0)).get("url")).isEqualTo("/dynamic-api");
        assertThat(doc).doesNotContainKeys("code", "message", "data");
    }

    // ---------------------------------------------------------------- 路由篩選、路徑、方法、參數

    @Test
    void onlyRoutesOfActiveServiceClassLoadersAreListed() throws Exception {
        IsolatingClassLoader ordersLoader = loader(Set.of(PREFIX + "OrdersController"), Set.of());
        IsolatingClassLoader inventoryLoader = loader(Set.of(PREFIX + "InventoryController"), Set.of());
        IsolatingClassLoader inactiveLoader = loader(Set.of(PREFIX + "InactiveController"), Set.of());
        register(mapping, ordersLoader.loadClass(PREFIX + "OrdersController"));
        register(mapping, inventoryLoader.loadClass(PREFIX + "InventoryController"));
        register(mapping, inactiveLoader.loadClass(PREFIX + "InactiveController"));
        register(mapping, SystemController.class, new SystemController());

        Map<String, Object> paths = asMap(generate(services("orders", ordersLoader, "inventory", inventoryLoader)).get("paths"));

        assertThat(paths).containsKeys("/orders/{id}", "/orders/search", "/orders", "/orders/any", "/orders/find",
                "/inventory/items", "/inventory/nodes");
        // 未啟用服務（ClassLoader 不在清單）與系統管理 API 都不列出
        assertThat(paths).doesNotContainKeys("/inactive/ping", "/system/ping");
        assertThat(paths.keySet()).allMatch(p -> p.startsWith("/orders") || p.startsWith("/inventory"));
    }

    @Test
    void routeFromDifferentClassLoaderIsExcludedEvenIfPublishUriMatchesPath() throws Exception {
        IsolatingClassLoader activeLoader = loader(Set.of(PREFIX + "OrdersController"), Set.of());
        IsolatingClassLoader staleLoader = loader(Set.of(PREFIX + "InactiveController"), Set.of());
        register(mapping, staleLoader.loadClass(PREFIX + "InactiveController"));

        // publishUri 字串與路徑前綴相同也不行，必須是同一個 ClassLoader 物件
        Map<String, Object> paths = asMap(generate(services("inactive", activeLoader)).get("paths"));

        assertThat(paths).isEmpty();
    }

    @Test
    void pathsAndHttpMethodsFollowRegisteredMappings() throws Exception {
        IsolatingClassLoader ordersLoader = loader(Set.of(PREFIX + "OrdersController"), Set.of());
        register(mapping, ordersLoader.loadClass(PREFIX + "OrdersController"));

        Map<String, Object> paths = asMap(generate(services("orders", ordersLoader)).get("paths"));

        // 類別層 /orders + 方法層 /{id:\d+}：正規式去除後為 {id}
        assertThat(paths).containsKey("/orders/{id}");
        assertThat(paths.keySet()).noneMatch(p -> p.contains(":") || p.contains("\\d"));
        assertThat(asMap(paths.get("/orders/{id}")).keySet()).containsExactly("get");
        assertThat(asMap(paths.get("/orders/search")).keySet()).containsExactly("get");
        // 類別層路徑 + 無方法層路徑的 @PostMapping
        assertThat(asMap(paths.get("/orders")).keySet()).containsExactly("post");
        // 未指定 HTTP 方法的 @RequestMapping
        assertThat(asMap(paths.get("/orders/any")).keySet())
                .containsExactlyInAnyOrder("get", "post", "put", "delete", "patch");
        // 同一路徑不同方法
        assertThat(asMap(paths.get("/orders/find")).keySet()).containsExactlyInAnyOrder("get", "post");
    }

    @Test
    void parametersMapToCorrectLocations() throws Exception {
        IsolatingClassLoader ordersLoader = loader(Set.of(PREFIX + "OrdersController"), Set.of());
        register(mapping, ordersLoader.loadClass(PREFIX + "OrdersController"));
        Map<String, Object> paths = asMap(generate(services("orders", ordersLoader)).get("paths"));

        // @PathVariable、@RequestHeader；HttpServletRequest 不列出
        Map<String, Object> getOrder = operation(paths, "/orders/{id}", "get");
        List<Object> getOrderParams = asList(getOrder.get("parameters"));
        assertThat(getOrderParams).hasSize(2);
        Map<String, Object> id = param(getOrderParams, "id");
        assertThat(id).containsEntry("in", "path").containsEntry("required", true);
        assertThat(asMap(id.get("schema"))).containsEntry("type", "integer").containsEntry("format", "int64");
        Map<String, Object> trace = param(getOrderParams, "X-Trace-Id");
        assertThat(trace).containsEntry("in", "header").containsEntry("required", true);
        assertThat(getOrderParams).noneMatch(p -> asMap(p).get("name").equals("request"));
        assertThat(getOrder).doesNotContainKey("requestBody");
        // 回應 schema 由回傳型別產生
        Map<String, Object> okSchema = jsonSchema(asMap(asMap(getOrder.get("responses")).get("200")));
        assertThat(asMap(okSchema.get("properties"))).containsKeys("orderNo", "amount", "status", "items");

        // @RequestParam：無 defaultValue → required=true；有 defaultValue → required=false
        List<Object> searchParams = asList(operation(paths, "/orders/search", "get").get("parameters"));
        assertThat(param(searchParams, "keyword")).containsEntry("in", "query").containsEntry("required", true);
        assertThat(param(searchParams, "size")).containsEntry("in", "query").containsEntry("required", false);
        Map<String, Object> optionalHeader = param(searchParams, "X-Locale");
        assertThat(optionalHeader).containsEntry("in", "header").containsEntry("required", false);

        // @RequestBody → application/json requestBody，不出現在 parameters
        Map<String, Object> create = operation(paths, "/orders", "post");
        assertThat(create).doesNotContainKey("parameters");
        Map<String, Object> requestBody = asMap(create.get("requestBody"));
        assertThat(requestBody).containsEntry("required", true);
        Map<String, Object> bodySchema = asMap(asMap(asMap(requestBody.get("content")).get("application/json")).get("schema"));
        assertThat(bodySchema).containsEntry("type", "object");
        assertThat(asMap(bodySchema.get("properties"))).containsKeys("orderNo", "amount", "status", "items");
        assertThat(asMap(asMap(bodySchema.get("properties")).get("items"))).containsEntry("type", "array");
    }

    @Test
    void requestBodyIsListedForGetAndDeleteOperations() throws Exception {
        IsolatingClassLoader ordersLoader = loader(Set.of(PREFIX + "OrdersController"), Set.of());
        register(mapping, ordersLoader.loadClass(PREFIX + "OrdersController"));
        Map<String, Object> paths = asMap(generate(services("orders", ordersLoader)).get("paths"));

        // @RequestBody 不論 HTTP 方法都要輸出 application/json requestBody
        for (String[] pathAndMethod : new String[][]{{"/orders/bulk", "delete"}, {"/orders/query", "get"}}) {
            Map<String, Object> op = operation(paths, pathAndMethod[0], pathAndMethod[1]);
            assertThat(op).containsKey("requestBody");
            Map<String, Object> requestBody = asMap(op.get("requestBody"));
            assertThat(requestBody).containsEntry("required", true);
            Map<String, Object> schema = asMap(asMap(asMap(requestBody.get("content")).get("application/json")).get("schema"));
            assertThat(schema).containsEntry("type", "object");
            assertThat(asMap(schema.get("properties"))).containsKeys("orderNo", "amount", "status", "items");
        }
    }

    @Test
    void tagsArePublishUriAndOperationIdsAreUnique() throws Exception {
        IsolatingClassLoader ordersLoader = loader(Set.of(PREFIX + "OrdersController"), Set.of());
        IsolatingClassLoader inventoryLoader = loader(Set.of(PREFIX + "InventoryController"), Set.of());
        register(mapping, ordersLoader.loadClass(PREFIX + "OrdersController"));
        register(mapping, inventoryLoader.loadClass(PREFIX + "InventoryController"));

        Map<String, Object> doc = generate(services("orders", ordersLoader, "inventory", inventoryLoader));
        Map<String, Object> paths = asMap(doc.get("paths"));

        List<String> operationIds = new ArrayList<>();
        for (Map.Entry<String, Object> pathEntry : paths.entrySet()) {
            String expectedTag = pathEntry.getKey().startsWith("/orders") ? "orders" : "inventory";
            for (Object op : asMap(pathEntry.getValue()).values()) {
                Map<String, Object> operation = asMap(op);
                assertThat(asList(operation.get("tags"))).containsExactly(expectedTag);
                operationIds.add((String) operation.get("operationId"));
            }
        }
        // 兩個名為 find 的多載方法、未指定方法產生的 5 個 operation，operationId 都不可重複
        assertThat(operationIds).hasSize(new HashSet<>(operationIds).size());
        assertThat(operationIds).hasSizeGreaterThanOrEqualTo(11);
        assertThat(asList(doc.get("tags"))).extracting(t -> asMap(t).get("name"))
                .containsExactlyInAnyOrder("orders", "inventory");
    }

    // ---------------------------------------------------------------- 即時性

    @Test
    void unregisteredRouteDisappearsOnNextGeneration() throws Exception {
        IsolatingClassLoader ordersLoader = loader(Set.of(PREFIX + "OrdersController"), Set.of());
        Map<RequestMappingInfo, Method> registered = register(mapping, ordersLoader.loadClass(PREFIX + "OrdersController"));
        Map<String, ClassLoader> services = services("orders", ordersLoader);

        assertThat(asMap(generate(services).get("paths"))).containsKey("/orders/search");

        RequestMappingInfo searchInfo = registered.entrySet().stream()
                .filter(e -> e.getValue().getName().equals("search")).findFirst().orElseThrow().getKey();
        mapping.unregisterMapping(searchInfo);

        Map<String, Object> after = asMap(generate(services).get("paths"));
        assertThat(after).doesNotContainKey("/orders/search");
        assertThat(after).containsKey("/orders/{id}");

        // 全部取消註冊（停用服務）後不留任何舊路由
        registered.keySet().stream().filter(info -> !info.equals(searchInfo)).forEach(mapping::unregisterMapping);
        assertThat(asMap(generate(services).get("paths"))).isEmpty();
    }

    // ---------------------------------------------------------------- 遞迴型別與容錯

    @Test
    void recursiveTypesProduceBoundedSchemaWithoutStackOverflow() throws Exception {
        IsolatingClassLoader inventoryLoader = loader(Set.of(PREFIX + "InventoryController"), Set.of());
        register(mapping, inventoryLoader.loadClass(PREFIX + "InventoryController"));

        Map<String, Object> doc = assertGeneratesWithoutException(services("inventory", inventoryLoader));
        Map<String, Object> nodes = operation(asMap(doc.get("paths")), "/inventory/nodes", "post");

        // 互相參照：TypeA → TypeB → TypeA
        Map<String, Object> bodySchema = asMap(asMap(asMap(asMap(nodes.get("requestBody")).get("content"))
                .get("application/json")).get("schema"));
        Map<String, Object> typeB = asMap(asMap(bodySchema.get("properties")).get("b"));
        assertThat(asMap(typeB.get("properties"))).containsKey("a");
        Map<String, Object> cycledA = asMap(asMap(typeB.get("properties")).get("a"));
        assertThat(cycledA).containsEntry("type", "object").doesNotContainKey("properties");

        // 自我參照：SelfNode.next、SelfNode.children
        Map<String, Object> responseSchema = jsonSchema(asMap(asMap(nodes.get("responses")).get("200")));
        assertThat(asMap(responseSchema.get("properties"))).containsKeys("name", "next", "children");
        assertThat(asMap(asMap(responseSchema.get("properties")).get("next"))).doesNotContainKey("properties");

        assertThat(maxDepth(doc)).isLessThan(60);
    }

    @Test
    void deeplyNestedTypeIsTruncatedAtDepthLimit() throws Exception {
        IsolatingClassLoader inventoryLoader = loader(Set.of(PREFIX + "InventoryController"), Set.of());
        register(mapping, inventoryLoader.loadClass(PREFIX + "InventoryController"));

        Map<String, Object> doc = generate(services("inventory", inventoryLoader));
        Map<String, Object> schema = jsonSchema(asMap(asMap(
                operation(asMap(doc.get("paths")), "/inventory/deep", "get").get("responses")).get("200")));

        int expanded = 0;
        Map<String, Object> current = schema;
        while (current.containsKey("properties")) {
            expanded++;
            current = asMap(asMap(current.get("properties")).get("next"));
        }
        assertThat(expanded).isEqualTo(OpenApiGenerator.MAX_SCHEMA_DEPTH);
        assertThat(current).containsEntry("type", "object");
    }

    @Test
    void failingHandlerIsSkippedAndOtherRoutesRemain() throws Exception {
        // BrokenDto 由隔離 ClassLoader 定義，但它的欄位型別 MissingDto 無法載入（模擬 JAR 缺少相依）
        IsolatingClassLoader inventoryLoader = loader(
                Set.of(PREFIX + "InventoryController", PREFIX + "BrokenDto"), Set.of(PREFIX + "MissingDto"));
        IsolatingClassLoader ordersLoader = loader(Set.of(PREFIX + "OrdersController"), Set.of());
        register(mapping, inventoryLoader.loadClass(PREFIX + "InventoryController"));
        register(mapping, ordersLoader.loadClass(PREFIX + "OrdersController"));

        Map<String, Object> doc = assertGeneratesWithoutException(
                services("inventory", inventoryLoader, "orders", ordersLoader));
        Map<String, Object> paths = asMap(doc.get("paths"));

        assertThat(paths).doesNotContainKey("/inventory/broken");
        assertThat(paths).containsKeys("/inventory/items", "/inventory/nodes", "/orders/{id}", "/orders/search");
    }

    // ---------------------------------------------------------------- HTTP 契約（完整 Spring 環境）

    @Nested
    @SpringBootTest
    @AutoConfigureMockMvc
    class HttpContract {

        @Autowired
        MockMvc mockMvc;

        @Test
        void getOpenApiReturnsRawDocumentWithNoStore() throws Exception {
            mockMvc.perform(get("/api/getOpenApi"))
                    .andExpect(status().isOk())
                    .andExpect(header().string("Cache-Control", containsString("no-store")))
                    .andExpect(jsonPath("$.openapi", startsWith("3.")))
                    .andExpect(jsonPath("$.info.title").exists())
                    .andExpect(jsonPath("$.servers[0].url").value("/dynamic-api"))
                    .andExpect(jsonPath("$.paths").isMap())
                    .andExpect(jsonPath("$.paths").isEmpty())
                    .andExpect(jsonPath("$.code").doesNotExist())
                    .andExpect(jsonPath("$.message").doesNotExist())
                    .andExpect(jsonPath("$.data").doesNotExist());
        }

        @Test
        void swaggerUiPageAndWebjarAreServed() throws Exception {
            mockMvc.perform(get("/swagger-ui.html"))
                    .andExpect(status().isOk())
                    .andExpect(content().string(containsString("url: 'api/getOpenApi'")));
            mockMvc.perform(get("/webjars/swagger-ui/5.17.14/swagger-ui-bundle.js"))
                    .andExpect(status().isOk());
        }
    }

    // ================================================================ helpers

    private Map<String, Object> generate(Map<String, ClassLoader> services) {
        return OpenApiGenerator.generate("/dynamic-api", services, mapping.getHandlerMethods());
    }

    private Map<String, Object> assertGeneratesWithoutException(Map<String, ClassLoader> services) {
        List<Map<String, Object>> holder = new ArrayList<>();
        assertThatCode(() -> holder.add(generate(services))).doesNotThrowAnyException();
        return holder.get(0);
    }

    private static Map<String, ClassLoader> services(Object... pairs) {
        Map<String, ClassLoader> services = new LinkedHashMap<>();
        for (int i = 0; i < pairs.length; i += 2) {
            services.put((String) pairs[i], (ClassLoader) pairs[i + 1]);
        }
        return services;
    }

    private static IsolatingClassLoader loader(Set<String> defined, Set<String> missing) {
        return new IsolatingClassLoader(OpenApiGeneratorTest.class.getClassLoader(), defined, missing);
    }

    private static Map<RequestMappingInfo, Method> register(RequestMappingHandlerMapping mapping, Class<?> controllerClass)
            throws ReflectiveOperationException {
        Constructor<?> constructor = controllerClass.getDeclaredConstructor();
        constructor.setAccessible(true);
        return register(mapping, controllerClass, constructor.newInstance());
    }

    /**
     * 與 DynamicControllerServiceImpl 相同的規則：類別層 @RequestMapping 路徑 + 方法層路徑，逐一 registerMapping。
     */
    private static Map<RequestMappingInfo, Method> register(RequestMappingHandlerMapping mapping, Class<?> controllerClass,
                                                            Object instance) {
        RequestMapping classMapping = controllerClass.getAnnotation(RequestMapping.class);
        String classPath = classMapping != null ? classMapping.value()[0] : "";
        Map<RequestMappingInfo, Method> registered = new LinkedHashMap<>();
        for (Method method : controllerClass.getDeclaredMethods()) {
            RequestMappingInfo.Builder builder = null;
            if (method.isAnnotationPresent(RequestMapping.class)) {
                RequestMapping m = method.getAnnotation(RequestMapping.class);
                builder = RequestMappingInfo.paths(combine(classPath, m.value())).methods(m.method());
            } else if (method.isAnnotationPresent(GetMapping.class)) {
                builder = RequestMappingInfo.paths(combine(classPath, method.getAnnotation(GetMapping.class).value()))
                        .methods(RequestMethod.GET);
            } else if (method.isAnnotationPresent(PostMapping.class)) {
                builder = RequestMappingInfo.paths(combine(classPath, method.getAnnotation(PostMapping.class).value()))
                        .methods(RequestMethod.POST);
            }
            if (builder != null) {
                RequestMappingInfo info = builder.build();
                mapping.registerMapping(info, instance, method);
                registered.put(info, method);
            }
        }
        return registered;
    }

    private static String[] combine(String classPath, String[] methodPaths) {
        if (methodPaths.length == 0) {
            return new String[]{classPath};
        }
        String[] result = new String[methodPaths.length];
        for (int i = 0; i < methodPaths.length; i++) {
            result[i] = classPath + methodPaths[i];
        }
        return result;
    }

    private static Map<String, Object> operation(Map<String, Object> paths, String path, String httpMethod) {
        assertThat(paths).containsKey(path);
        Map<String, Object> pathItem = asMap(paths.get(path));
        assertThat(pathItem).containsKey(httpMethod);
        return asMap(pathItem.get(httpMethod));
    }

    private static Map<String, Object> param(List<Object> params, String name) {
        return params.stream().map(OpenApiGeneratorTest::asMap).filter(p -> name.equals(p.get("name")))
                .findFirst().orElseThrow(() -> new AssertionError("missing parameter " + name + " in " + params));
    }

    private static Map<String, Object> jsonSchema(Map<String, Object> response) {
        return asMap(asMap(asMap(response.get("content")).get("application/json")).get("schema"));
    }

    private static int maxDepth(Object node) {
        if (node instanceof Map<?, ?> map) {
            int max = 0;
            for (Object value : map.values()) {
                max = Math.max(max, maxDepth(value));
            }
            return max + 1;
        }
        if (node instanceof List<?> list) {
            int max = 0;
            for (Object value : list) {
                max = Math.max(max, maxDepth(value));
            }
            return max + 1;
        }
        return 0;
    }

    @SuppressWarnings("unchecked")
    private static Map<String, Object> asMap(Object value) {
        assertThat(value).isInstanceOf(Map.class);
        return (Map<String, Object>) value;
    }

    @SuppressWarnings("unchecked")
    private static List<Object> asList(Object value) {
        assertThat(value).isInstanceOf(List.class);
        return (List<Object>) value;
    }

    /**
     * 模擬使用者 JAR 的 ClassLoader：只自行定義指定的類別（因此 getClassLoader() 是本物件），
     * 其餘委派父載入器；missing 中的類別一律載入失敗。
     */
    static final class IsolatingClassLoader extends ClassLoader {
        private final Set<String> defined;
        private final Set<String> missing;

        IsolatingClassLoader(ClassLoader parent, Set<String> defined, Set<String> missing) {
            super(parent);
            this.defined = defined;
            this.missing = missing;
        }

        @Override
        protected Class<?> loadClass(String name, boolean resolve) throws ClassNotFoundException {
            if (missing.contains(name)) {
                throw new ClassNotFoundException(name);
            }
            if (!defined.contains(name)) {
                return super.loadClass(name, resolve);
            }
            synchronized (getClassLoadingLock(name)) {
                Class<?> loaded = findLoadedClass(name);
                if (loaded == null) {
                    String resource = name.replace('.', '/') + ".class";
                    try (InputStream in = getParent().getResourceAsStream(resource)) {
                        if (in == null) {
                            throw new ClassNotFoundException(name);
                        }
                        byte[] bytes = in.readAllBytes();
                        loaded = defineClass(name, bytes, 0, bytes.length);
                    } catch (IOException e) {
                        throw new ClassNotFoundException(name, e);
                    }
                }
                if (resolve) {
                    resolveClass(loaded);
                }
                return loaded;
            }
        }
    }

    // ================================================================ fixtures（模擬使用者 JAR 的 controller 與 DTO）

    public enum OrderStatus { NEW, PAID }

    public static class OrderItem {
        public String sku;
        public int quantity;
    }

    public static class OrderDto {
        public String orderNo;
        public java.math.BigDecimal amount;
        public OrderStatus status;
        public List<OrderItem> items;
    }

    public static class SelfNode {
        public String name;
        public SelfNode next;
        public List<SelfNode> children;
    }

    public static class TypeA {
        public String label;
        public TypeB b;
    }

    public static class TypeB {
        public TypeA a;
    }

    public static class Deep1 { public Deep2 next; }
    public static class Deep2 { public Deep3 next; }
    public static class Deep3 { public Deep4 next; }
    public static class Deep4 { public Deep5 next; }
    public static class Deep5 { public Deep6 next; }
    public static class Deep6 { public Deep7 next; }
    public static class Deep7 { public Deep8 next; }
    public static class Deep8 { public String value; }

    @RequestMapping("/system")
    public static class SystemController {
        @GetMapping("/ping")
        public String ping() {
            return "pong";
        }
    }
}

// ==================================================================== 由隔離 ClassLoader 定義的 fixture
// 必須是頂層類別：巢狀類別若由不同 ClassLoader 定義，會與外層的 InnerClasses 屬性不相容。
// 不標 @RestController，避免被 @SpringBootTest 的元件掃描註冊；測試只看 @RequestMapping 系列註解。

@RequestMapping("/orders")
class OpenApiFixtureOrdersController {
    @GetMapping("/{id:\\d+}")
    public OrderDto getOrder(@PathVariable("id") Long id, @RequestHeader("X-Trace-Id") String traceId,
                             HttpServletRequest request) {
        return null;
    }

    @GetMapping("/search")
    public List<OrderDto> search(@RequestParam("keyword") String keyword,
                                 @RequestParam(value = "size", defaultValue = "10") int size,
                                 @RequestHeader(value = "X-Locale", required = false) String locale) {
        return null;
    }

    @PostMapping
    public OrderDto create(@RequestBody OrderDto body) {
        return body;
    }

    @RequestMapping("/any")
    public String any() {
        return "any";
    }

    @GetMapping("/find")
    public OrderDto find(@RequestParam("orderNo") String orderNo) {
        return null;
    }

    @PostMapping("/find")
    public OrderDto find(@RequestBody OrderDto criteria) {
        return null;
    }

    @RequestMapping(value = "/bulk", method = RequestMethod.DELETE)
    public void bulkDelete(@RequestBody OrderDto criteria) {
    }

    @GetMapping("/query")
    public List<OrderDto> query(@RequestBody OrderDto criteria) {
        return null;
    }
}

/** 模擬 JAR 缺少相依：測試中的隔離 ClassLoader 會拒絕載入此類別 */
class OpenApiFixtureMissingDto {
    public String value;
}

class OpenApiFixtureBrokenDto {
    public OpenApiFixtureMissingDto missing;
}

@RequestMapping("/inventory")
class OpenApiFixtureInventoryController {
    @GetMapping("/items")
    public Map<String, Integer> items() {
        return Map.of();
    }

    @PostMapping("/nodes")
    public SelfNode nodes(@RequestBody TypeA body) {
        return null;
    }

    @GetMapping("/deep")
    public Deep1 deep() {
        return null;
    }

    @GetMapping("/broken")
    public OpenApiFixtureBrokenDto broken() {
        return null;
    }
}

@RequestMapping("/inactive")
class OpenApiFixtureInactiveController {
    @GetMapping("/ping")
    public String ping() {
        return "pong";
    }
}
