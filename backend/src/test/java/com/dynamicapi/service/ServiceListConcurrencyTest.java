package com.dynamicapi.service;

import com.dynamicapi.dto.ControllerDTO;
import com.dynamicapi.dto.EndpointDTO;
import com.dynamicapi.entity.ControllerEntity;
import com.dynamicapi.entity.EndpointEntity;
import com.dynamicapi.entity.JarFileEntity;
import com.dynamicapi.enums.JarFileStatus;
import com.dynamicapi.jarbase.TestBase;
import com.dynamicapi.jdbc.MockResponseJDBC;
import com.dynamicapi.repository.ControllerRepository;
import com.dynamicapi.repository.EndpointRepository;
import com.dynamicapi.repository.JarFileRepository;
import com.zipe.enums.ResourceEnum;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentLinkedQueue;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicIntegerArray;
import java.util.function.Function;
import java.util.function.Supplier;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.fail;

/**
 * issue #19：SOAP Endpoint 與 RESTful 清單查詢並行時不可互相拿到對方的資料。
 * <p>
 * 不使用交易回滾，讓其他執行緒看得到測試資料；資料前後自行清除。
 */
class ServiceListConcurrencyTest extends TestBase {

    private static final List<String> EP_URIS = List.of("it19-ep-1", "it19-ep-2", "it19-ep-3");
    private static final List<String> RF_URIS = List.of("it19-rf-1", "it19-rf-2", "it19-rf-3", "it19-rf-4");
    private static final String EP_PREFIX = "it19-ep-";
    private static final String RF_PREFIX = "it19-rf-";

    private static final String NOT_EXIST_URI = "it19-not-exist";
    private static final String[] KIND_NAMES = {"清單", "依 id", "依 publishUri", "查無資料／交叉類型"};

    private static final int THREADS = 16;
    private static final int ROUNDS = 200;

    @Autowired
    private DynamicWebService dynamicWebService;

    @Autowired
    private DynamicControllerService dynamicControllerService;

    @Autowired
    private JarFileRepository jarFileRepository;

    @Autowired
    private EndpointRepository endpointRepository;

    @Autowired
    private ControllerRepository controllerRepository;

    private String jarFileId;

    private final List<String> endpointIds = new ArrayList<>();

    private final List<String> controllerIds = new ArrayList<>();

    @BeforeEach
    void setUp() {
        cleanUp();
        JarFileEntity jar = new JarFileEntity();
        jar.setName("it19-" + UUID.randomUUID().toString().substring(0, 8) + ".jar");
        jar.setStatus(JarFileStatus.INACTIVE);
        jarFileId = jarFileRepository.save(jar).getId();

        endpointIds.clear();
        for (String uri : EP_URIS) {
            EndpointEntity e = new EndpointEntity();
            e.setUuId(UUID.randomUUID().toString());
            e.setPublishUri(uri);
            e.setBeanName(uri.replace("-", ""));
            e.setJarFileId(jarFileId);
            e.setClassPath("com.example.It19Endpoint");
            e.setIsActive(Boolean.FALSE);
            e.setIgnoreCdata(Boolean.FALSE);
            endpointRepository.save(e);
            endpointIds.add(e.getUuId());
        }

        controllerIds.clear();
        for (String uri : RF_URIS) {
            ControllerEntity c = new ControllerEntity();
            c.setUuId(UUID.randomUUID().toString());
            c.setPublishUri(uri);
            c.setJarFileId(jarFileId);
            c.setClassPath("com.example.It19Controller");
            c.setIsActive(Boolean.FALSE);
            controllerRepository.save(c);
            controllerIds.add(c.getUuId());
        }
    }

    @AfterEach
    void tearDown() {
        cleanUp();
    }

    private void cleanUp() {
        EP_URIS.forEach(uri -> endpointRepository.findById(uri).ifPresent(endpointRepository::delete));
        RF_URIS.forEach(uri -> controllerRepository.findById(uri).ifPresent(controllerRepository::delete));
        if (jarFileId != null) {
            jarFileRepository.findById(jarFileId).ifPresent(jarFileRepository::delete);
            jarFileId = null;
        }
    }

    @Test
    void listQueriesRunConcurrentlyWithoutCrossingTypes() throws Exception {
        // 單執行緒基準：資料庫可能還有其他測試留下的資料，所以以實際總筆數為準
        int endpointBaseline = dynamicWebService.getEndpoints().size();
        int controllerBaseline = dynamicControllerService.getControllers().size();
        assertEndpointList(dynamicWebService.getEndpoints(), endpointBaseline);
        assertControllerList(dynamicControllerService.getControllers(), controllerBaseline);

        ConcurrentLinkedQueue<String> failures = new ConcurrentLinkedQueue<>();
        AtomicBoolean stop = new AtomicBoolean(false);
        CountDownLatch ready = new CountDownLatch(THREADS + 1);
        CountDownLatch start = new CountDownLatch(1);
        ExecutorService pool = Executors.newFixedThreadPool(THREADS + 1);
        List<Future<?>> futures = new ArrayList<>();

        // 干擾執行緒：模擬執行期 Mock 命中（MockResponseDao）反覆寫入 ResourceEnum.SQL 的共用狀態
        Future<?> interferer = pool.submit(() -> {
            ready.countDown();
            awaitQuietly(start);
            while (!stop.get()) {
                ResourceEnum.SQL.getResource(MockResponseJDBC.SQL_SELECT_RESPONSE_CONTENT);
            }
        });

        // 每種（服務類型 × 查詢種類）的實際執行次數與依 id／publishUri 查到的索引，用來確認新斷言真的在並行中執行
        AtomicIntegerArray kindCounts = new AtomicIntegerArray(2 * KIND_NAMES.length);
        AtomicIntegerArray endpointIndexHits = new AtomicIntegerArray(EP_URIS.size());
        AtomicIntegerArray controllerIndexHits = new AtomicIntegerArray(RF_URIS.size());

        int roundsPerThread = ROUNDS / THREADS + 1;
        for (int t = 0; t < THREADS; t++) {
            final int thread = t;
            futures.add(pool.submit(() -> {
                ready.countDown();
                awaitQuietly(start);
                for (int r = 0; r < roundsPerThread; r++) {
                    // SOAP 與 RESTful 在同一輪交錯：相鄰執行緒、相鄰輪次的類型相反
                    int k = r + thread;
                    boolean endpointTurn = k % 2 == 0;
                    int step = k / 2;
                    int kind = (step + thread) % KIND_NAMES.length;
                    // 與 kind 錯開的輪替值，讓同一種查詢也會輪到 3 筆 Endpoint／4 筆 Controller 的每一筆
                    int variant = step / KIND_NAMES.length + thread;
                    String label = (endpointTurn ? "Endpoint " : "Controller ") + KIND_NAMES[kind];
                    try {
                        if (endpointTurn) {
                            runEndpointQuery(kind, variant % EP_URIS.size(), variant,
                                    endpointBaseline, endpointIndexHits);
                        } else {
                            runControllerQuery(kind, variant % RF_URIS.size(), variant,
                                    controllerBaseline, controllerIndexHits);
                        }
                    } catch (Throwable e) {
                        failures.add(label + "（執行緒 " + thread + "、第 " + r + " 輪）: " + e);
                    } finally {
                        kindCounts.incrementAndGet((endpointTurn ? 0 : KIND_NAMES.length) + kind);
                    }
                }
            }));
        }

        try {
            assertTrue(ready.await(30, TimeUnit.SECONDS), "執行緒沒有在時限內就緒");
            start.countDown();
            for (Future<?> f : futures) {
                f.get(120, TimeUnit.SECONDS);
            }
            stop.set(true);
            interferer.get(30, TimeUnit.SECONDS);
        } finally {
            // 就緒逾時、Future 失敗或中斷時也要停止干擾、放開仍在等待起跑的執行緒並關閉執行緒池
            stop.set(true);
            start.countDown();
            pool.shutdownNow();
            if (!pool.awaitTermination(30, TimeUnit.SECONDS)) {
                failures.add("執行緒池未在 30 秒內結束");
            }
        }

        if (!failures.isEmpty()) {
            fail("並行查詢共 " + failures.size() + " 次結果錯誤，前 5 筆：" +
                    failures.stream().limit(5).collect(Collectors.joining("\n")));
        }

        // 確認每種查詢在並行中都實際執行過，且 3 筆 Endpoint、4 筆 Controller 都被依 id／publishUri 查到
        StringBuilder stats = new StringBuilder("ServiceListConcurrencyTest 並行查詢統計：");
        int total = 0;
        for (int type = 0; type < 2; type++) {
            for (int kind = 0; kind < KIND_NAMES.length; kind++) {
                int count = kindCounts.get(type * KIND_NAMES.length + kind);
                String label = (type == 0 ? "Endpoint " : "Controller ") + KIND_NAMES[kind];
                stats.append(' ').append(label).append('=').append(count).append(';');
                total += count;
                assertTrue(count > 0, label + " 沒有在並行工作執行緒中執行");
            }
        }
        for (int i = 0; i < EP_URIS.size(); i++) {
            assertTrue(endpointIndexHits.get(i) > 0, "沒有並行查到 " + EP_URIS.get(i));
        }
        for (int i = 0; i < RF_URIS.size(); i++) {
            assertTrue(controllerIndexHits.get(i) > 0, "沒有並行查到 " + RF_URIS.get(i));
        }
        assertTrue(total >= ROUNDS, "並行查詢總次數不足 " + ROUNDS + "：" + total);
        stats.append(" 合計=").append(total);
        System.out.println(stats);
    }

    /** kind：0 整份清單、1 依 id、2 依 publishUri、3 查無資料／交叉類型。 */
    private void runEndpointQuery(int kind, int i, int variant, int baseline, AtomicIntegerArray indexHits) {
        switch (kind) {
            case 0 -> assertEndpointList(dynamicWebService.getEndpoints(), baseline);
            case 1 -> {
                EndpointDTO byId = dynamicWebService.getEndpoint(endpointIds.get(i), null);
                assertNotNull(byId, "依 id 查 Endpoint 回傳 null");
                assertEquals(EP_URIS.get(i), byId.getPublishUri(), "依 id 查 Endpoint 的 publishUri 錯誤");
                assertEquals(jarFileId, byId.getJarFileId(), "依 id 查 Endpoint 的 jarFileId 錯誤");
                indexHits.incrementAndGet(i);
            }
            case 2 -> {
                EndpointDTO byUri = dynamicWebService.getEndpoint(null, EP_URIS.get(i));
                assertNotNull(byUri, "依 publishUri 查 Endpoint 回傳 null");
                assertEquals(endpointIds.get(i), byUri.getId(), "依 publishUri 查 Endpoint 的 id 錯誤");
                assertEquals(EP_URIS.get(i), byUri.getPublishUri(), "依 publishUri 查 Endpoint 的 publishUri 錯誤");
                indexHits.incrementAndGet(i);
            }
            default -> {
                switch (variant % 3) {
                    case 0 -> expectNotFound("Endpoint 不存在的 id",
                            () -> dynamicWebService.getEndpoint(UUID.randomUUID().toString(), null),
                            dto -> ((EndpointDTO) dto).getPublishUri());
                    case 1 -> expectNotFound("Endpoint publishUri=it19-not-exist",
                            () -> dynamicWebService.getEndpoint(null, NOT_EXIST_URI),
                            dto -> ((EndpointDTO) dto).getPublishUri());
                    default -> expectNotFound("以 Controller 的 publishUri 查 Endpoint",
                            () -> dynamicWebService.getEndpoint(null, RF_URIS.get(variant % RF_URIS.size())),
                            dto -> ((EndpointDTO) dto).getPublishUri());
                }
            }
        }
    }

    /** kind：0 整份清單、1 依 id、2 依 publishUri、3 查無資料／交叉類型。 */
    private void runControllerQuery(int kind, int i, int variant, int baseline, AtomicIntegerArray indexHits) {
        switch (kind) {
            case 0 -> assertControllerList(dynamicControllerService.getControllers(), baseline);
            case 1 -> {
                ControllerDTO byId = dynamicControllerService.getController(controllerIds.get(i), null);
                assertNotNull(byId, "依 id 查 Controller 回傳 null");
                assertEquals(RF_URIS.get(i), byId.getPublishUri(), "依 id 查 Controller 的 publishUri 錯誤");
                assertEquals(jarFileId, byId.getJarFileId(), "依 id 查 Controller 的 jarFileId 錯誤");
                indexHits.incrementAndGet(i);
            }
            case 2 -> {
                ControllerDTO byUri = dynamicControllerService.getController(null, RF_URIS.get(i));
                assertNotNull(byUri, "依 publishUri 查 Controller 回傳 null");
                assertEquals(controllerIds.get(i), byUri.getId(), "依 publishUri 查 Controller 的 id 錯誤");
                assertEquals(RF_URIS.get(i), byUri.getPublishUri(), "依 publishUri 查 Controller 的 publishUri 錯誤");
                indexHits.incrementAndGet(i);
            }
            default -> {
                switch (variant % 3) {
                    case 0 -> expectNotFound("Controller 不存在的 id",
                            () -> dynamicControllerService.getController(UUID.randomUUID().toString(), null),
                            dto -> ((ControllerDTO) dto).getPublishUri());
                    case 1 -> expectNotFound("Controller publishUri=it19-not-exist",
                            () -> dynamicControllerService.getController(null, NOT_EXIST_URI),
                            dto -> ((ControllerDTO) dto).getPublishUri());
                    default -> expectNotFound("以 Endpoint 的 publishUri 查 Controller",
                            () -> dynamicControllerService.getController(null, EP_URIS.get(variant % EP_URIS.size())),
                            dto -> ((ControllerDTO) dto).getPublishUri());
                }
            }
        }
    }

    /** 既有行為：查無資料時丟出 IllegalArgumentException；若回傳了資料（例如另一類服務）就判定失敗並帶出內容。 */
    private static void expectNotFound(String label, Supplier<Object> query, Function<Object, String> describe) {
        Object result;
        try {
            result = query.get();
        } catch (IllegalArgumentException expected) {
            return;
        }
        fail(label + " 應丟出 IllegalArgumentException，卻回傳 publishUri="
                + (result == null ? "null(DTO 為 null)" : describe.apply(result)));
    }

    @Test
    void singleQueriesReturnTheMatchingRecord() {
        for (int i = 0; i < EP_URIS.size(); i++) {
            EndpointDTO byId = dynamicWebService.getEndpoint(endpointIds.get(i), null);
            assertEquals(EP_URIS.get(i), byId.getPublishUri());
            assertEquals(jarFileId, byId.getJarFileId());
            EndpointDTO byUri = dynamicWebService.getEndpoint(null, EP_URIS.get(i));
            assertEquals(endpointIds.get(i), byUri.getId());
            EndpointDTO byBoth = dynamicWebService.getEndpoint(endpointIds.get(i), EP_URIS.get(i));
            assertEquals(EP_URIS.get(i), byBoth.getPublishUri());
        }
        for (int i = 0; i < RF_URIS.size(); i++) {
            ControllerDTO byId = dynamicControllerService.getController(controllerIds.get(i), null);
            assertEquals(RF_URIS.get(i), byId.getPublishUri());
            assertEquals(jarFileId, byId.getJarFileId());
            ControllerDTO byUri = dynamicControllerService.getController(null, RF_URIS.get(i));
            assertEquals(controllerIds.get(i), byUri.getId());
            ControllerDTO byBoth = dynamicControllerService.getController(controllerIds.get(i), RF_URIS.get(i));
            assertEquals(RF_URIS.get(i), byBoth.getPublishUri());
        }
        // id 與 publishUri 不相符時查不到
        assertThrows(IllegalArgumentException.class,
                () -> dynamicWebService.getEndpoint(endpointIds.get(0), EP_URIS.get(1)));
    }

    @Test
    void singleQueriesNotFoundKeepExistingBehaviour() {
        // 既有行為：查無資料時 BeanUtils.copyProperties(null, dto) 丟出 IllegalArgumentException
        assertThrows(IllegalArgumentException.class,
                () -> dynamicWebService.getEndpoint(UUID.randomUUID().toString(), null));
        assertThrows(IllegalArgumentException.class,
                () -> dynamicWebService.getEndpoint(null, "it19-not-exist"));
        assertThrows(IllegalArgumentException.class,
                () -> dynamicControllerService.getController(UUID.randomUUID().toString(), null));
        assertThrows(IllegalArgumentException.class,
                () -> dynamicControllerService.getController(null, "it19-not-exist"));
        // Endpoint 的 publishUri 不可查到 Controller，反之亦然
        assertThrows(IllegalArgumentException.class,
                () -> dynamicWebService.getEndpoint(null, RF_URIS.get(0)));
        assertThrows(IllegalArgumentException.class,
                () -> dynamicControllerService.getController(null, EP_URIS.get(0)));
    }

    private static void assertEndpointList(List<EndpointDTO> list, int expectedSize) {
        assertNotNull(list);
        Set<String> uris = list.stream().map(EndpointDTO::getPublishUri).collect(Collectors.toSet());
        assertEquals(expectedSize, list.size(), "Endpoint 筆數錯誤：" + uris);
        assertTrue(uris.containsAll(EP_URIS), "Endpoint 清單缺少 it19-ep-*：" + uris);
        assertTrue(uris.stream().noneMatch(u -> u != null && u.startsWith(RF_PREFIX)),
                "Endpoint 清單出現 Controller 資料：" + uris);
        assertEquals(EP_URIS.size(), uris.stream().filter(u -> u != null && u.startsWith(EP_PREFIX)).count());
    }

    private static void assertControllerList(List<ControllerDTO> list, int expectedSize) {
        assertNotNull(list);
        Set<String> uris = list.stream().map(ControllerDTO::getPublishUri).collect(Collectors.toSet());
        assertEquals(expectedSize, list.size(), "Controller 筆數錯誤：" + uris);
        assertTrue(uris.containsAll(RF_URIS), "Controller 清單缺少 it19-rf-*：" + uris);
        assertTrue(uris.stream().noneMatch(u -> u != null && u.startsWith(EP_PREFIX)),
                "Controller 清單出現 Endpoint 資料：" + uris);
        assertEquals(RF_URIS.size(), uris.stream().filter(u -> u != null && u.startsWith(RF_PREFIX)).count());
    }

    private static void awaitQuietly(CountDownLatch latch) {
        try {
            latch.await();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}
