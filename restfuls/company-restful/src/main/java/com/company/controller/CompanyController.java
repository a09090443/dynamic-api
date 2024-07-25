package com.company.controller;

import com.company.dto.CompanyDTO;
import com.company.dto.CompanyResponseDTO;
import com.dynamicapi.webservice.BaseWebservice;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.zipe.annotation.ResponseResultBody;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@ResponseResultBody
@RequestMapping(value = "/company", produces = MediaType.APPLICATION_JSON_VALUE)
public class CompanyController extends BaseWebservice {
    public CompanyController() {
    }

    @PostMapping("/data")
    public CompanyResponseDTO getResponseData(@RequestBody CompanyDTO exampleDTO) throws JsonProcessingException {
        ObjectMapper objectMapper = new ObjectMapper();
        String jsonString = objectMapper.writeValueAsString(exampleDTO);
        log.info("request json:{}", jsonString);
        String responseContent = mockResponseDao.findByPrimaryKey("company", "getResponseData", jsonString, String.class);
        CompanyResponseDTO companyResponseDTO = objectMapper.readValue(responseContent, CompanyResponseDTO.class);
        return companyResponseDTO;
    }
}
