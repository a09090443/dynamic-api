package com.company.controller;

import com.company.dto.CompanyDTO;
import com.company.dto.CompanyResponseDTO;
import com.dynamicapi.enums.ServiceType;
import com.dynamicapi.jarbase.RestfulBase;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.zipe.annotation.ResponseResultBody;
import com.zipe.dto.Result;
import com.zipe.exception.IResultStatus;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

@Slf4j
@RestController
@ResponseResultBody
@RequestMapping(value = "/company", produces = MediaType.APPLICATION_JSON_VALUE)
public class CompanyController extends RestfulBase {
    private static final String PUBLISH_URI = "company";

    public CompanyController() {
    }

    @PostMapping("/data")
    public ResponseEntity<Object> getResponseData(@RequestBody CompanyDTO exampleDTO) throws JsonProcessingException {
        ObjectMapper objectMapper = new ObjectMapper();
        String jsonString = objectMapper.writeValueAsString(exampleDTO);
        log.info("request json:{}", jsonString);
        String responseContent = findByPrimaryKey(PUBLISH_URI, "getResponseData", jsonString, String.class);
        // 查無資料時回傳 ""，無法建立實例時回傳 null，兩者都要先判斷，不能直接交給 readValue
        if (responseContent == null || responseContent.isBlank()) {
            Map<String, String> error = new LinkedHashMap<>();
            error.put("error", "MOCK_RESPONSE_NOT_FOUND");
            error.put("publishUri", PUBLISH_URI);
            error.put("method", "getResponseData");
            error.put("condition", jsonString);
            // 直接回傳 ResponseEntity 才能保留 404；拋 ResponseStatusException 會被全域例外處理轉成 500。
            // 本文先包成 Result，@ResponseResultBody 會原樣放行，回應為 {code:404,message,data:{...}}
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Result.failure(NotFoundStatus.MOCK_RESPONSE_NOT_FOUND, error));
        }
        CompanyResponseDTO companyResponseDTO = objectMapper.readValue(responseContent, CompanyResponseDTO.class);
        // @ResponseResultBody 不會包裝 ResponseEntity 內的本文，成功分支也要自行包成 Result
        return ResponseEntity.ok(Result.success(companyResponseDTO));
    }

    private enum NotFoundStatus implements IResultStatus {
        MOCK_RESPONSE_NOT_FOUND;

        @Override
        public HttpStatus getHttpStatus() {
            return HttpStatus.NOT_FOUND;
        }

        @Override
        public Integer getCode() {
            return HttpStatus.NOT_FOUND.value();
        }

        @Override
        public String getMessage() {
            return "Mock response not found";
        }
    }
}
