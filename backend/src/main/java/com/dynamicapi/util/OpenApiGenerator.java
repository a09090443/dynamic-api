package com.dynamicapi.util;

import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ValueConstants;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.mvc.method.RequestMappingInfo;

import java.lang.reflect.Field;
import java.lang.reflect.GenericArrayType;
import java.lang.reflect.Method;
import java.lang.reflect.Modifier;
import java.lang.reflect.Parameter;
import java.lang.reflect.ParameterizedType;
import java.lang.reflect.Type;
import java.lang.reflect.TypeVariable;
import java.lang.reflect.WildcardType;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;

/**
 * 依「已註冊在 RequestMappingHandlerMapping 的路由」即時產生 OpenAPI 3.0.3 文件。
 * <p>
 * 為避免使用者 JAR 的 ClassLoader 洩漏：
 * <ul>
 *     <li>只使用 java.lang.reflect 解析型別，不使用 springdoc、swagger-core、Spring 或 Jackson 的型別解析工具等帶全域快取的元件；</li>
 *     <li>本類別沒有任何 static 或成員欄位保存使用者的型別資訊；每次呼叫 {@link #generate} 都新建 {@link SchemaBuilder}，
 *     產生結果只包含字串、數字、布林、Map 與 List。</li>
 * </ul>
 */
@Slf4j
public final class OpenApiGenerator {

    public static final String OPENAPI_VERSION = "3.0.3";

    /** 巢狀物件 schema 的最大展開層數，超過時以不展開的 object 表示 */
    public static final int MAX_SCHEMA_DEPTH = 5;

    private static final String JSON = "application/json";

    private static final String[] DEFAULT_HTTP_METHODS = {"get", "post", "put", "delete", "patch"};

    private OpenApiGenerator() {
    }

    /**
     * 產生 OpenAPI 文件。
     *
     * @param serverUrl      servers[0].url（context path，例如 /dynamic-api）
     * @param serviceLoaders 已啟用 RESTful 服務：publishUri → 該服務的 ClassLoader
     * @param handlerMethods requestMappingHandlerMapping.getHandlerMethods() 的註冊結果
     * @return OpenAPI 文件（只含 Map／List／基本型別）
     */
    public static Map<String, Object> generate(String serverUrl,
                                               Map<String, ? extends ClassLoader> serviceLoaders,
                                               Map<RequestMappingInfo, HandlerMethod> handlerMethods) {
        SchemaBuilder schemaBuilder = new SchemaBuilder();
        Map<String, Map<String, Object>> paths = new TreeMap<>();
        Set<String> operationIds = new HashSet<>();
        Set<String> usedTags = new LinkedHashSet<>();

        for (Map.Entry<RequestMappingInfo, HandlerMethod> entry : handlerMethods.entrySet()) {
            HandlerMethod handlerMethod = entry.getValue();
            String publishUri = findPublishUri(serviceLoaders, handlerMethod);
            if (publishUri == null) {
                continue;
            }
            try {
                Map<String, Map<String, Object>> operations = buildOperations(entry.getKey(), handlerMethod, publishUri, schemaBuilder);
                for (Map.Entry<String, Map<String, Object>> pathEntry : operations.entrySet()) {
                    String[] key = pathEntry.getKey().split(" ", 2);
                    Map<String, Object> operation = pathEntry.getValue();
                    operation.put("operationId", uniqueOperationId((String) operation.get("operationId"), operationIds));
                    paths.computeIfAbsent(key[1], k -> new TreeMap<>()).put(key[0], operation);
                }
                usedTags.add(publishUri);
            } catch (Exception | LinkageError e) {
                log.warn("OpenAPI 略過無法解析的路由 {}（服務 {}）：{}", entry.getKey(), publishUri, e.toString());
            }
        }

        Map<String, Object> document = new LinkedHashMap<>();
        document.put("openapi", OPENAPI_VERSION);
        Map<String, Object> info = new LinkedHashMap<>();
        info.put("title", "Dynamic API Manager - RESTful 服務");
        info.put("description", "依目前已啟用的 RESTful 服務即時產生；SOAP Endpoint 請使用 WSDL。");
        info.put("version", "1.0.0");
        document.put("info", info);
        Map<String, Object> server = new LinkedHashMap<>();
        server.put("url", serverUrl == null || serverUrl.isEmpty() ? "/" : serverUrl);
        document.put("servers", List.of(server));
        List<Map<String, Object>> tags = new ArrayList<>();
        for (String tag : usedTags) {
            Map<String, Object> tagMap = new LinkedHashMap<>();
            tagMap.put("name", tag);
            tags.add(tagMap);
        }
        document.put("tags", tags);
        document.put("paths", new LinkedHashMap<>(paths));
        return document;
    }

    private static String findPublishUri(Map<String, ? extends ClassLoader> serviceLoaders, HandlerMethod handlerMethod) {
        ClassLoader beanLoader = handlerMethod.getBeanType().getClassLoader();
        if (beanLoader == null) {
            return null;
        }
        for (Map.Entry<String, ? extends ClassLoader> service : serviceLoaders.entrySet()) {
            // 以 ClassLoader 是否為同一物件判斷路由屬於哪個服務，不以 publishUri 字串推算路徑
            if (service.getValue() == beanLoader) {
                return service.getKey();
            }
        }
        return null;
    }

    /**
     * @return key 為 "{httpMethod} {path}"
     */
    private static Map<String, Map<String, Object>> buildOperations(RequestMappingInfo info, HandlerMethod handlerMethod,
                                                                    String publishUri, SchemaBuilder schemaBuilder) {
        Method method = handlerMethod.getMethod();
        List<String> httpMethods = new ArrayList<>();
        for (RequestMethod requestMethod : info.getMethodsCondition().getMethods()) {
            httpMethods.add(requestMethod.name().toLowerCase());
        }
        if (httpMethods.isEmpty()) {
            httpMethods.addAll(List.of(DEFAULT_HTTP_METHODS));
        }

        List<Map<String, Object>> parameters = new ArrayList<>();
        Map<String, Object> requestBody = null;
        Set<String> declaredPathVariables = new HashSet<>();
        Parameter[] methodParameters = method.getParameters();
        Type[] genericTypes = method.getGenericParameterTypes();
        for (int i = 0; i < methodParameters.length; i++) {
            Parameter parameter = methodParameters[i];
            Type type = i < genericTypes.length ? genericTypes[i] : parameter.getParameterizedType();

            PathVariable pathVariable = parameter.getAnnotation(PathVariable.class);
            RequestParam requestParam = parameter.getAnnotation(RequestParam.class);
            RequestHeader requestHeader = parameter.getAnnotation(RequestHeader.class);
            RequestBody body = parameter.getAnnotation(RequestBody.class);
            if (pathVariable != null) {
                if (isMap(type)) {
                    continue;
                }
                String name = firstNonEmpty(pathVariable.value(), pathVariable.name(), parameter.getName());
                declaredPathVariables.add(name);
                parameters.add(parameter(name, "path", true, schemaBuilder.build(type)));
            } else if (requestParam != null) {
                if (isMap(type)) {
                    continue;
                }
                String name = firstNonEmpty(requestParam.value(), requestParam.name(), parameter.getName());
                boolean required = requestParam.required() && ValueConstants.DEFAULT_NONE.equals(requestParam.defaultValue());
                parameters.add(parameter(name, "query", required, schemaBuilder.build(type)));
            } else if (requestHeader != null) {
                if (isMap(type)) {
                    continue;
                }
                String name = firstNonEmpty(requestHeader.value(), requestHeader.name(), parameter.getName());
                boolean required = requestHeader.required() && ValueConstants.DEFAULT_NONE.equals(requestHeader.defaultValue());
                parameters.add(parameter(name, "header", required, schemaBuilder.build(type)));
            } else if (body != null) {
                requestBody = new LinkedHashMap<>();
                requestBody.put("required", body.required());
                requestBody.put("content", jsonContent(schemaBuilder.build(type)));
            }
            // 其他沒有上述註解的參數（HttpServletRequest 等）不列出
        }

        Map<String, Object> responses = new LinkedHashMap<>();
        Map<String, Object> ok = new LinkedHashMap<>();
        ok.put("description", "OK");
        Type returnType = method.getGenericReturnType();
        if (returnType != void.class && returnType != Void.class) {
            ok.put("content", jsonContent(schemaBuilder.build(returnType)));
        }
        responses.put("200", ok);

        Map<String, Map<String, Object>> result = new LinkedHashMap<>();
        Set<String> patterns = info.getPatternValues();
        for (String pattern : patterns) {
            String path = toOpenApiPath(pattern);
            List<Map<String, Object>> operationParameters = new ArrayList<>(parameters);
            // OpenAPI 要求路徑中的每個變數都要有 path 參數
            for (String variable : pathVariableNames(path)) {
                if (!declaredPathVariables.contains(variable)) {
                    operationParameters.add(parameter(variable, "path", true, SchemaBuilder.typeSchema("string")));
                }
            }
            for (String httpMethod : httpMethods) {
                Map<String, Object> operation = new LinkedHashMap<>();
                operation.put("tags", List.of(publishUri));
                operation.put("summary", handlerMethod.getBeanType().getSimpleName() + "#" + method.getName());
                String baseId = publishUri + "_" + method.getName() + (httpMethods.size() > 1 ? "_" + httpMethod : "");
                operation.put("operationId", baseId.replaceAll("[^A-Za-z0-9_]", "_"));
                if (!operationParameters.isEmpty()) {
                    operation.put("parameters", operationParameters);
                }
                // 依實際 handler 宣告輸出本文，不分 HTTP 方法；OpenAPI 3.0.3 未定義 GET／DELETE 本文的語意，部分工具可能忽略此欄位
                if (requestBody != null) {
                    operation.put("requestBody", requestBody);
                }
                operation.put("responses", responses);
                result.put(httpMethod + " " + path, operation);
            }
        }
        return result;
    }

    private static String uniqueOperationId(String baseId, Set<String> operationIds) {
        String candidate = baseId;
        int counter = 2;
        while (!operationIds.add(candidate)) {
            candidate = baseId + "_" + counter++;
        }
        return candidate;
    }

    private static Map<String, Object> parameter(String name, String in, boolean required, Map<String, Object> schema) {
        Map<String, Object> parameter = new LinkedHashMap<>();
        parameter.put("name", name);
        parameter.put("in", in);
        parameter.put("required", required);
        parameter.put("schema", schema);
        return parameter;
    }

    private static Map<String, Object> jsonContent(Map<String, Object> schema) {
        Map<String, Object> mediaType = new LinkedHashMap<>();
        mediaType.put("schema", schema);
        Map<String, Object> content = new LinkedHashMap<>();
        content.put(JSON, mediaType);
        return content;
    }

    private static boolean isMap(Type type) {
        Class<?> raw = SchemaBuilder.rawClass(type);
        return raw != null && Map.class.isAssignableFrom(raw);
    }

    private static String firstNonEmpty(String... values) {
        for (String value : values) {
            if (value != null && !value.isEmpty()) {
                return value;
            }
        }
        return "arg";
    }

    /**
     * 把 Spring 路徑樣式轉成 OpenAPI 路徑：{id:\d+} → {id}、{*rest} → {rest}。
     */
    static String toOpenApiPath(String pattern) {
        StringBuilder sb = new StringBuilder();
        int i = 0;
        while (i < pattern.length()) {
            char c = pattern.charAt(i);
            if (c != '{') {
                sb.append(c);
                i++;
                continue;
            }
            int depth = 1;
            int j = i + 1;
            StringBuilder name = new StringBuilder();
            boolean inName = true;
            while (j < pattern.length() && depth > 0) {
                char d = pattern.charAt(j);
                if (d == '{') {
                    depth++;
                } else if (d == '}') {
                    depth--;
                    if (depth == 0) {
                        break;
                    }
                } else if (d == ':' && depth == 1) {
                    inName = false;
                }
                if (inName && depth == 1) {
                    name.append(d);
                }
                j++;
            }
            String variable = name.toString().trim();
            if (variable.startsWith("*")) {
                variable = variable.substring(1);
            }
            sb.append('{').append(variable).append('}');
            i = j + 1;
        }
        return sb.toString();
    }

    private static List<String> pathVariableNames(String path) {
        List<String> names = new ArrayList<>();
        int start = path.indexOf('{');
        while (start >= 0) {
            int end = path.indexOf('}', start);
            if (end < 0) {
                break;
            }
            names.add(path.substring(start + 1, end));
            start = path.indexOf('{', end);
        }
        return names;
    }

    /**
     * 把 Java 型別轉成 JSON schema；每次產生文件時新建，處理完即可回收，不保留任何型別快取。
     * 物件以 inline 方式展開，遇到循環參照或超過 {@link #MAX_SCHEMA_DEPTH} 層時停止展開。
     */
    static final class SchemaBuilder {

        /**
         * 每次呼叫使用新的區域集合追蹤目前展開路徑上的型別，方法結束即釋放，不存在任何欄位中。
         */
        Map<String, Object> build(Type type) {
            return build(type, 0, new HashSet<>());
        }

        static Map<String, Object> typeSchema(String type) {
            Map<String, Object> schema = new LinkedHashMap<>();
            schema.put("type", type);
            return schema;
        }

        private static Map<String, Object> typeSchema(String type, String format) {
            Map<String, Object> schema = typeSchema(type);
            schema.put("format", format);
            return schema;
        }

        static Class<?> rawClass(Type type) {
            if (type instanceof Class<?> clazz) {
                return clazz;
            }
            if (type instanceof ParameterizedType parameterizedType && parameterizedType.getRawType() instanceof Class<?> raw) {
                return raw;
            }
            if (type instanceof GenericArrayType) {
                return Object[].class;
            }
            return null;
        }

        private Map<String, Object> build(Type type, int depth, Set<Class<?>> visiting) {
            if (type instanceof WildcardType wildcardType) {
                Type[] upper = wildcardType.getUpperBounds();
                return upper.length > 0 ? build(upper[0], depth, visiting) : typeSchema("object");
            }
            if (type instanceof TypeVariable<?>) {
                return typeSchema("object");
            }
            if (type instanceof GenericArrayType arrayType) {
                return arraySchema(arrayType.getGenericComponentType(), depth, visiting);
            }
            Class<?> raw = rawClass(type);
            if (raw == null) {
                return typeSchema("object");
            }
            Type[] typeArguments = type instanceof ParameterizedType parameterizedType
                    ? parameterizedType.getActualTypeArguments() : new Type[0];

            String name = raw.getName();
            // 包裝型別：ResponseEntity<T>、HttpEntity<T>、Optional<T>、CompletableFuture<T> 等取內層型別
            if (typeArguments.length == 1 && (name.equals("org.springframework.http.ResponseEntity")
                    || name.equals("org.springframework.http.HttpEntity")
                    || name.equals("java.util.Optional")
                    || name.equals("java.util.concurrent.CompletableFuture")
                    || name.equals("java.util.concurrent.Future"))) {
                return build(typeArguments[0], depth, visiting);
            }
            Map<String, Object> simple = simpleSchema(raw);
            if (simple != null) {
                return simple;
            }
            if (raw.isArray()) {
                return arraySchema(raw.getComponentType(), depth, visiting);
            }
            if (Collection.class.isAssignableFrom(raw)) {
                return arraySchema(typeArguments.length == 1 ? typeArguments[0] : Object.class, depth, visiting);
            }
            if (Map.class.isAssignableFrom(raw)) {
                Map<String, Object> schema = typeSchema("object");
                if (typeArguments.length == 2) {
                    schema.put("additionalProperties", build(typeArguments[1], depth + 1, visiting));
                }
                return schema;
            }
            if (raw.isEnum()) {
                Map<String, Object> schema = typeSchema("string");
                List<String> values = new ArrayList<>();
                for (Object constant : raw.getEnumConstants()) {
                    values.add(((Enum<?>) constant).name());
                }
                schema.put("enum", values);
                return schema;
            }
            if (name.startsWith("java.") || name.startsWith("javax.") || name.startsWith("jakarta.")
                    || name.startsWith("org.springframework.") || name.startsWith("com.fasterxml.")) {
                return typeSchema("object");
            }
            return objectSchema(raw, depth, visiting);
        }

        private Map<String, Object> arraySchema(Type componentType, int depth, Set<Class<?>> visiting) {
            Map<String, Object> schema = typeSchema("array");
            schema.put("items", build(componentType, depth + 1, visiting));
            return schema;
        }

        private Map<String, Object> objectSchema(Class<?> raw, int depth, Set<Class<?>> visiting) {
            Map<String, Object> schema = typeSchema("object");
            if (depth >= MAX_SCHEMA_DEPTH || visiting.contains(raw)) {
                schema.put("description", raw.getSimpleName() + "（循環參照或層數過深，未展開）");
                return schema;
            }
            visiting.add(raw);
            try {
                Map<String, Object> properties = new LinkedHashMap<>();
                List<Class<?>> hierarchy = new ArrayList<>();
                for (Class<?> current = raw; current != null && current != Object.class; current = current.getSuperclass()) {
                    hierarchy.add(0, current);
                }
                for (Class<?> current : hierarchy) {
                    for (Field field : current.getDeclaredFields()) {
                        int modifiers = field.getModifiers();
                        if (Modifier.isStatic(modifiers) || Modifier.isTransient(modifiers) || field.isSynthetic()) {
                            continue;
                        }
                        properties.put(field.getName(), build(field.getGenericType(), depth + 1, visiting));
                    }
                }
                if (!properties.isEmpty()) {
                    schema.put("properties", properties);
                }
                return schema;
            } finally {
                visiting.remove(raw);
            }
        }

        private static Map<String, Object> simpleSchema(Class<?> raw) {
            if (raw == String.class || raw == char.class || raw == Character.class || CharSequence.class.isAssignableFrom(raw)) {
                return typeSchema("string");
            }
            if (raw == int.class || raw == Integer.class || raw == short.class || raw == Short.class
                    || raw == byte.class || raw == Byte.class) {
                return typeSchema("integer", "int32");
            }
            if (raw == long.class || raw == Long.class) {
                return typeSchema("integer", "int64");
            }
            if (raw == java.math.BigInteger.class) {
                return typeSchema("integer");
            }
            if (raw == float.class || raw == Float.class) {
                return typeSchema("number", "float");
            }
            if (raw == double.class || raw == Double.class) {
                return typeSchema("number", "double");
            }
            if (raw == java.math.BigDecimal.class || raw == Number.class) {
                return typeSchema("number");
            }
            if (raw == boolean.class || raw == Boolean.class) {
                return typeSchema("boolean");
            }
            if (raw == java.time.LocalDate.class) {
                return typeSchema("string", "date");
            }
            if (raw == java.time.LocalDateTime.class || raw == java.time.OffsetDateTime.class
                    || raw == java.time.ZonedDateTime.class || raw == java.time.Instant.class
                    || java.util.Date.class.isAssignableFrom(raw)) {
                return typeSchema("string", "date-time");
            }
            if (raw == java.util.UUID.class) {
                return typeSchema("string", "uuid");
            }
            if (raw == byte[].class) {
                return typeSchema("string", "byte");
            }
            if (raw == Object.class) {
                return typeSchema("object");
            }
            return null;
        }
    }
}
