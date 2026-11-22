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

        int roundsPerThread = ROUNDS / THREADS + 1;
        for (int t = 0; t < THREADS; t++) {
            final boolean endpointFirst = t % 2 == 0;
            futures.add(pool.submit(() -> {
                ready.countDown();
                awaitQuietly(start);
                for (int r = 0; r < roundsPerThread; r++) {
                    boolean endpointTurn = (r % 2 == 0) == endpointFirst;
                    try {
                        if (endpointTurn) {
                            assertEndpointList(dynamicWebService.getEndpoints(), endpointBaseline);
                        } else {
                            assertControllerList(dynamicControllerService.getControllers(), controllerBaseline);
                        }
                    } catch (Throwable e) {
                        failures.add((endpointTurn ? "getEndpoints: " : "getControllers: ") + e);
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
