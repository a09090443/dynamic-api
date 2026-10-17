package com.dynamicapi.controller;

import com.dynamicapi.dto.JarFileResponseDTO;
import com.dynamicapi.dto.MockResponseRequestDTO;
import com.dynamicapi.dto.MockResponseResponseDTO;
import com.dynamicapi.service.CommonService;
import com.zipe.annotation.ResponseResultBody;
import com.zipe.dto.Result;
import com.zipe.enums.ResultStatus;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang.StringUtils;
import org.springframework.beans.BeanUtils;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.Objects;

@Slf4j
@RestController
@ResponseResultBody
@RequestMapping(value = "/common", produces = MediaType.APPLICATION_JSON_VALUE)
@CrossOrigin(origins = "http://localhost:4200") // 允許來自 http://localhost:4200 的請求
public class CommonController {

    private final CommonService commonService;

    protected CommonController(CommonService commonService) {
        this.commonService = commonService;
    }

    /**
     * 上傳 Jar 檔案
     *
     * @param file Jar 檔案
     * @return JarFileResponseDTO
     * @throws IOException
     */
    @PostMapping("/uploadJarFile")
    public Result<JarFileResponseDTO> uploadJarFile(@RequestParam("file") MultipartFile file) throws IOException {
        // 檢查檔案是否為空或不是以 .jar 結尾
        if (file.isEmpty() || !Objects.requireNonNull(file.getOriginalFilename()).endsWith(".jar")) {
            log.error("Upload jar file failed: file is empty or not a jar file");
            return Result.failure(ResultStatus.BAD_REQUEST);
        }

        // 執行實際的檔案上傳操作，這裡假設使用 dynamicWebService 來處理上傳
        JarFileResponseDTO jarFileResponse = commonService.uploadJarFile(file.getInputStream());

        // 返回成功上傳的訊息和新檔案編號
        return Result.success(jarFileResponse);
    }

    /**
     * 根據條件取得 Mock Response 的內容
     *
     * @param request MockResponseRequestDTO
     * @return String
     */
    @PostMapping("/getResponseContent")
    public Result<String> getResponseContent(@RequestBody MockResponseRequestDTO request) {
        String content = commonService.getResponseContent(request);
        return Result.success(content);
    }

    /**
     * 根據條件取得 Mock Response 的列表
     *
     * @param request MockResponseRequestDTO
     * @return List<MockResponseResponseDTO>
     */
    @PostMapping("/getResponseList")
    public Result<List<MockResponseResponseDTO>> getResponseList(@RequestBody MockResponseRequestDTO request) {
        List<MockResponseResponseDTO> mockResponseResponseList = commonService.getResponseList(request);
        return Result.success(mockResponseResponseList);
    }

    /**
     * 儲存 Mock Response
     *
     * @param request MockResponseRequestDTO
     * @return MockResponseResponseDTO
     */
    @PostMapping("/saveMockResponse")
    public Result<MockResponseResponseDTO> saveMockResponse(@RequestBody MockResponseRequestDTO request) {
        log.info("Save mock response: {}", request);

        if (StringUtils.isBlank(request.getPublishUri())) {
            log.error("PublishUri is blank");
        }
        if (StringUtils.isBlank(request.getMethod())) {
            log.error("Method is blank");
        }
        if (StringUtils.isBlank(request.getCondition())) {
            log.error("Condition is blank");
        }
        if (StringUtils.isBlank(request.getPublishUri()) ||
                StringUtils.isBlank(request.getMethod()) ||
                StringUtils.isBlank(request.getCondition())) {
            return Result.failure(ResultStatus.BAD_REQUEST);
        }

        commonService.saveMockResponse(request);
        MockResponseResponseDTO mockResponseResponse = new MockResponseResponseDTO();
        BeanUtils.copyProperties(request, mockResponseResponse);

        return Result.success(mockResponseResponse);
    }

    /**
     * 更新 Mock Response
     *
     * @param request MockResponseRequestDTO
     * @return MockResponseResponseDTO
     */
    @PostMapping("/updateResponse")
    public Result<MockResponseResponseDTO> updateResponse(@RequestBody MockResponseRequestDTO request) {
        log.info("Update response: {}", request);
        try {
            commonService.updateMockResponse(request);
        } catch (Exception e) {
            log.error("Register web service failed:{}", e.getMessage(), e);
            return Result.failure(ResultStatus.BAD_REQUEST);
        }

        MockResponseResponseDTO response = new MockResponseResponseDTO();
        BeanUtils.copyProperties(request, response);
        return Result.success(response);
    }

    /**
     * 刪除 Mock Response
     *
     * @param ids Mock Response 的 ID 列表
     * @return String
     */
    @DeleteMapping("/deleteResponse")
    public Result<String> deleteResponse(@RequestBody String[] ids) {
        for (String id : ids) {
            commonService.deleteMockResponse(id);
        }
        return Result.success(StringUtils.EMPTY);
    }

    /**
     * 切換 Mock Response 的啟用狀態
     *
     * @param id       Mock Response 的 ID
     * @param isActive 是否啟用
     * @return String
     */
    @GetMapping("/switchResponse")
    public Result<String> switchResponse(@RequestParam String id, @RequestParam Boolean isActive) {
        if (StringUtils.isNotBlank(id) && isActive != null) {
            try {
                commonService.switchMockResponse(id, isActive);
            } catch (Exception e) {
                log.error("Switch endpoint failure, id:{}, isActive:{}", id, isActive, e);
            }
        }
        return Result.success(StringUtils.EMPTY);
    }

    /**
     * 即時串流日誌檔案內容
     *
     * @param logFileName 日誌檔案名稱
     * @param tailLines   從末尾讀取的行數
     * @param response    HttpServletResponse
     * @return SseEmitter
     */
    @GetMapping(value = "/logs/stream", produces = "text/event-stream;charset=UTF-8")
    public SseEmitter streamLogFile(
            @RequestParam(defaultValue = "MockWebservice.log") String logFileName,
            @RequestParam(defaultValue = "100") int tailLines,
            HttpServletResponse response) {
        // 明確設置響應的字符編碼
        response.setCharacterEncoding("UTF-8");
        response.setContentType("text/event-stream;charset=UTF-8");

        return commonService.streamLogFile(logFileName, tailLines);
    }
}
