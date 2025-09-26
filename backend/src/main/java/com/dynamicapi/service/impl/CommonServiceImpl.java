package com.dynamicapi.service.impl;

import com.dynamicapi.dto.JarFileResponseDTO;
import com.dynamicapi.dto.MockResponseRequestDTO;
import com.dynamicapi.dto.MockResponseResponseDTO;
import com.dynamicapi.entity.JarFileEntity;
import com.dynamicapi.entity.MockResponseEntity;
import com.dynamicapi.enums.JarFileStatus;
import com.dynamicapi.exception.WebserviceException;
import com.dynamicapi.jdbc.MockResponseJDBC;
import com.dynamicapi.repository.JarFileRepository;
import com.dynamicapi.repository.MockResponseRepository;
import com.dynamicapi.service.CommonService;
import com.zipe.enums.ResourceEnum;
import com.zipe.util.time.DateTimeUtils;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang.StringUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.IncorrectResultSizeDataAccessException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.io.InputStream;
import java.io.RandomAccessFile;
import java.nio.charset.StandardCharsets;
import java.nio.file.FileSystems;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.nio.file.StandardWatchEventKinds;
import java.nio.file.WatchEvent;
import java.nio.file.WatchKey;
import java.nio.file.WatchService;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;

@Slf4j
@Service
public class CommonServiceImpl implements CommonService {

    private final String jarFileDir;

    private final JarFileRepository jarFileRepository;

    private final MockResponseRepository mockResponseRepository;

    private final MockResponseJDBC mockResponseJDBC;

    private final String logFileDir;

    private final ExecutorService executorService = Executors.newCachedThreadPool();

    public CommonServiceImpl(@Value("${jar.file.dir}") String jarFileDir,
                             JarFileRepository jarFileRepository,
                             MockResponseRepository mockResponseRepository,
                             MockResponseJDBC mockResponseJDBC,
                             @Value("${log.base}") String logFileDir) {
        this.jarFileDir = jarFileDir;
        this.jarFileRepository = jarFileRepository;
        this.mockResponseRepository = mockResponseRepository;
        this.mockResponseJDBC = mockResponseJDBC;
        this.logFileDir = logFileDir;
    }

    @Transactional(rollbackFor = Exception.class)
    @Override
    public JarFileResponseDTO uploadJarFile(InputStream inputStream) throws IOException {
        // 確保上傳目錄存在
        Path uploadPath = Paths.get(jarFileDir);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        String newFileName = UUID.randomUUID() + ".jar";
        // 儲存檔案到本地檔案系統
        Path filePath = uploadPath.resolve(newFileName);
        Files.copy(inputStream, filePath, StandardCopyOption.REPLACE_EXISTING);

        JarFileEntity jarFileEntity = new JarFileEntity();
        jarFileEntity.setName(newFileName);
        jarFileEntity.setStatus(JarFileStatus.INACTIVE);
        jarFileEntity = jarFileRepository.save(jarFileEntity);

        JarFileResponseDTO jarFileResponse = new JarFileResponseDTO();
        jarFileResponse.setJarFileId(jarFileEntity.getId());
        jarFileResponse.setJarFileName(jarFileEntity.getName());
        return jarFileResponse;
    }

    @Override
    public String getResponseContent(MockResponseRequestDTO request) {

        if (StringUtils.isBlank(request.getPublishUri())) {
            throw new WebserviceException("Publish URL is required");
        } else if (StringUtils.isBlank(request.getMethod())) {
            throw new WebserviceException("Method is required");
        } else if (StringUtils.isBlank(request.getCondition())) {
            throw new WebserviceException("Condition is required");
        }
        MockResponseEntity mockResponseEntity = mockResponseRepository.findByIdPublishUriAndIdMethodAndIdConditionAndIsActiveAndIdServiceType(request.getPublishUri(), request.getMethod(), request.getCondition(), Boolean.TRUE, request.getServiceType());
        return Optional.ofNullable(mockResponseEntity).map(MockResponseEntity::getResponseContent).orElse("");
    }

    @Override
    public List<MockResponseResponseDTO> getResponseList(MockResponseRequestDTO request) {
        if (StringUtils.isBlank(request.getPublishUri())) {
            throw new WebserviceException("Publish URL is required");
        }
        List<MockResponseEntity> mockResponseEntity = mockResponseRepository.findByIdPublishUriAndIdServiceType(request.getPublishUri(), request.getServiceType());
        return mockResponseEntity.stream().map(mockResponse -> {
            MockResponseResponseDTO response = new MockResponseResponseDTO();
            response.setId(mockResponse.getUuId());
            response.setPublishUri(mockResponse.getId().getPublishUri());
            response.setMethod(mockResponse.getId().getMethod());
            response.setCondition(mockResponse.getId().getCondition());
            response.setResponseContent(mockResponse.getResponseContent());
            response.setIsActive(mockResponse.getIsActive());
            return response;
        }).toList();
    }

    @Transactional(rollbackFor = Exception.class)
    @Override
    public void saveMockResponse(MockResponseRequestDTO request) {
        MockResponseEntity mockResponseEntity = new MockResponseEntity();
        mockResponseEntity.setUuId(UUID.randomUUID().toString());
        mockResponseEntity.getId().setPublishUri(request.getPublishUri());
        mockResponseEntity.getId().setMethod(request.getMethod());
        mockResponseEntity.getId().setCondition(request.getCondition());
        mockResponseEntity.getId().setServiceType(request.getServiceType());
        mockResponseEntity.setResponseContent(request.getResponseContent());
        mockResponseEntity.setIsActive(Boolean.FALSE);
        mockResponseRepository.save(mockResponseEntity);
        request.setId(mockResponseEntity.getUuId());
    }

    @Transactional(rollbackFor = Exception.class)
    @Override
    public void updateMockResponse(MockResponseRequestDTO request) {
        ResourceEnum resource = ResourceEnum.SQL.getResource(MockResponseJDBC.SQL_UPDATE_RESPONSE);

        Map<String, Object> paramMap = new HashMap<>();
        paramMap.put("publishUri", request.getPublishUri());
        paramMap.put("method", request.getMethod());
        paramMap.put("condition", request.getCondition());
        paramMap.put("responseContent", request.getResponseContent());
        paramMap.put("id", request.getId());
        paramMap.put("updatedAt", DateTimeUtils.getDateNow());
        try {
            mockResponseJDBC.update(resource, paramMap);
        } catch (IncorrectResultSizeDataAccessException e) {
            log.error("publishUri:{}", request.getPublishUri());
            log.error("method:{}", request.getMethod());
            log.error("condition:{}", request.getCondition());
            log.error("responseContent:{}", request.getResponseContent());
            throw new WebserviceException("更新 Mock Response 失敗");
        }
    }

    @Transactional(rollbackFor = Exception.class)
    @Override
    public void updateMockResponse(String oriPublishUri, String newPublishUri) {
        ResourceEnum resource = ResourceEnum.SQL.getResource(MockResponseJDBC.SQL_UPDATE_PUBLISH_URI_FOR_RESPONSE);
        Map<String, Object> paramMap = new HashMap<>();
        paramMap.put("oriPublishUri", oriPublishUri);
        paramMap.put("newPublishUri", newPublishUri);
        paramMap.put("updatedAt", DateTimeUtils.getDateNow());
        try {
            mockResponseJDBC.update(resource, paramMap);
        } catch (IncorrectResultSizeDataAccessException e) {
            log.error("oriPublishUri:{}", oriPublishUri);
            log.error("newPublishUri:{}", newPublishUri);
            log.error("IncorrectResultSizeDataAccessException:{}", e.getMessage(), e);
            throw new WebserviceException("更新 Mock Response 失敗");
        }
    }

    @Transactional(rollbackFor = Exception.class)
    @Override
    public void deleteMockResponse(String id) {
        ResourceEnum resource = ResourceEnum.SQL.getResource(MockResponseJDBC.SQL_DEL_RESPONSE);
        Map<String, Object> paramMap = new HashMap<>();
        paramMap.put("id", id);
        try {
            mockResponseJDBC.update(resource, paramMap);
        } catch (IncorrectResultSizeDataAccessException e) {
            log.error("id:{}", id);
            log.error("IncorrectResultSizeDataAccessException:{}", e.getMessage(), e);
            throw new WebserviceException("刪除 Mock Response 失敗");
        }
    }

    @Transactional(rollbackFor = Exception.class)
    @Override
    public void switchMockResponse(String id, Boolean status) {
        MockResponseEntity mockResponseEntity = mockResponseRepository.findByUuId(id);
        mockResponseEntity.setIsActive(status);
        try {
            mockResponseRepository.save(mockResponseEntity);
        } catch (Exception e) {
            throw new WebserviceException("切換 Mock Response 狀態失敗");
        }
    }

    @Override
    public SseEmitter streamLogFile(String logFileName, int tailLines) {
        SseEmitter emitter = new SseEmitter(30000L); // 設置合理的超時時間，而非無限
        AtomicBoolean isCompleted = new AtomicBoolean(false);

        CompletableFuture.runAsync(() -> {
            Path logPath = Paths.get(logFileDir, logFileName);

            try {
                if (!Files.exists(logPath)) {
                    if (!isCompleted.get()) {
                        emitter.send(SseEmitter.event().data("Log file not found: " + logFileName));
                        emitter.complete();
                    }
                    return;
                }

                sendInitialLines(emitter, logPath, tailLines, isCompleted);

                if (!isCompleted.get()) {
                    monitorFileChangesWithSSE(emitter, logPath, isCompleted);
                }

            } catch (IOException e) {
                log.debug("Client disconnected from SSE: {}", e.getMessage());
                isCompleted.set(true);
            } catch (Exception e) {
                log.error("Error streaming log file: {}", e.getMessage(), e);
                if (!isCompleted.get()) {
                    try {
                        emitter.send(SseEmitter.event().data("Error reading log file: " + e.getMessage()));
                    } catch (IOException ex) {
                        log.debug("Failed to send error message, client likely disconnected");
                    }
                    emitter.completeWithError(e);
                }
            }
        }, executorService);

        // 連線狀態處理
        emitter.onCompletion(() -> {
            log.debug("SSE connection completed for log file: {}", logFileName);
            isCompleted.set(true);
        });
        emitter.onTimeout(() -> {
            log.debug("SSE connection timeout for log file: {}", logFileName);
            isCompleted.set(true);
        });
        emitter.onError((ex) -> {
            log.debug("SSE connection error for log file: {}", logFileName);
            isCompleted.set(true);
        });

        return emitter;
    }

    private void sendInitialLines(SseEmitter emitter, Path logPath, int tailLines, AtomicBoolean isCompleted) throws IOException {
        List<String> lastLines = getLastNLines(logPath, tailLines);
        for (String line : lastLines) {
            if (isCompleted.get()) {
                break;
            }
            emitter.send(line);
        }
    }

    private void monitorFileChangesWithSSE(SseEmitter emitter, Path logPath, AtomicBoolean isCompleted) throws IOException {
        try (WatchService watchService = FileSystems.getDefault().newWatchService()) {
            Path dir = logPath.getParent();
            dir.register(watchService, StandardWatchEventKinds.ENTRY_MODIFY);

            long lastPosition = Files.size(logPath);

            while (!isCompleted.get()) {
                try {
                    WatchKey key = watchService.poll(1, TimeUnit.SECONDS);
                    if (key != null) {
                        lastPosition = processWatchEventsWithSSE(emitter, logPath, key, lastPosition, isCompleted);
                        key.reset();
                    }

                } catch (InterruptedException e) {
                    log.info("Log monitoring interrupted");
                    Thread.currentThread().interrupt();
                    break;
                } catch (IOException e) {
                    log.info("Client disconnected from SSE log stream");
                    break;
                }
            }
        } catch (Exception e) {
            log.error("Error in file monitoring", e);
            emitter.completeWithError(e);
        }

        if (!isCompleted.get()) {
            emitter.complete();
        }
    }

    private long processWatchEventsWithSSE(SseEmitter emitter, Path logPath, WatchKey key, long lastPosition, AtomicBoolean isCompleted) throws IOException {
        for (WatchEvent<?> event : key.pollEvents()) {
            if (isCompleted.get()) {
                break;
            }
            if (isTargetFileModified(event, logPath)) {
                lastPosition = readNewContentWithSSE(emitter, logPath, lastPosition, isCompleted);
            }
        }
        return lastPosition;
    }

    private long readNewContentWithSSE(SseEmitter emitter, Path logPath, long lastPosition, AtomicBoolean isCompleted) throws IOException {
        try (RandomAccessFile file = new RandomAccessFile(logPath.toFile(), "r")) {
            if (file.length() > lastPosition) {
                file.seek(lastPosition);
                String line;
                while ((line = file.readLine()) != null && !isCompleted.get()) {
                    String convertedLine = new String(line.getBytes(StandardCharsets.ISO_8859_1), StandardCharsets.UTF_8);
                    emitter.send(convertedLine);
                }
                return file.length();
            }
        }
        return lastPosition;
    }

    private boolean isTargetFileModified(WatchEvent<?> event, Path logPath) {
        return event.context().toString().equals(logPath.getFileName().toString());
    }

    private List<String> getLastNLines(Path filePath, int n) throws IOException {
        List<String> result = new ArrayList<>();

        try (RandomAccessFile file = new RandomAccessFile(filePath.toFile(), "r")) {
            long fileLength = file.length();
            if (fileLength == 0) {
                return result;
            }

            StringBuilder sb = new StringBuilder();
            long pointer = fileLength - 1;

            // 從檔案末尾開始讀取
            file.seek(pointer);

            int lineCount = 0;
            while (pointer >= 0 && lineCount < n) {
                file.seek(pointer);
                char c = (char) file.read();

                if (c == '\n') {
                    if (sb.length() > 0) {
                        // 處理編碼問題
                        String line = new String(sb.reverse().toString().getBytes(StandardCharsets.ISO_8859_1), StandardCharsets.UTF_8);
                        result.add(0, line);
                        sb.setLength(0);
                        lineCount++;
                    }
                } else {
                    sb.append(c);
                }
                pointer--;
            }

            // 處理最後一行（檔案開頭的那一行）
            if (sb.length() > 0 && lineCount < n) {
                String line = new String(sb.reverse().toString().getBytes(StandardCharsets.ISO_8859_1), StandardCharsets.UTF_8);
                result.add(0, line);
            }
        }

        return result;
    }
}
