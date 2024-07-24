package com.example.controller;

import com.dynamicapi.dao.MockResponseDao;
import com.dynamicapi.webservice.BaseWebservice;
import com.example.dto.ExampleDTO;
import com.example.dto.ExampleResponseDTO;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.zipe.annotation.ResponseResultBody;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@ResponseResultBody
@RequestMapping(value = "/example", produces = MediaType.APPLICATION_JSON_VALUE)
public class ExampleController extends BaseWebservice {

    public ExampleController() {
    }

    @GetMapping("/test")
    public String getTestResponse() {
        return "Test Response";
    }

    @PostMapping("/data")
    public ExampleResponseDTO getResponseData(ExampleDTO exampleDTO) throws JsonProcessingException {
        ObjectMapper objectMapper = new ObjectMapper();
        String jsonString = objectMapper.writeValueAsString(exampleDTO);
        log.info("request json:{}", jsonString);
        return mockResponseDao.findByPrimaryKey("ccms", "getCardListing", jsonString, ExampleResponseDTO.class);
    }
}
