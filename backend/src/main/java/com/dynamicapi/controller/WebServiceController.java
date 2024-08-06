package com.dynamicapi.controller;

import com.dynamicapi.dto.EndpointDTO;
import com.dynamicapi.dto.EndpointResponseDTO;
import com.dynamicapi.dto.WebServiceRequestDTO;
import com.dynamicapi.enums.JarFileStatus;
import com.dynamicapi.exception.WebserviceException;
import com.dynamicapi.service.CommonService;
import com.dynamicapi.service.DynamicWebService;
import com.zipe.annotation.ResponseResultBody;
import com.zipe.dto.Result;
import com.zipe.enums.ResultStatus;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang.StringUtils;
import org.springframework.beans.BeanUtils;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@Slf4j
@RestController
@ResponseResultBody
@RequestMapping(value = "/ws", produces = MediaType.APPLICATION_JSON_VALUE)
@CrossOrigin(origins = "http://localhost:4200") // 允許來自 http://localhost:4200 的請求
public class WebServiceController {

    private final DynamicWebService dynamicWebService;

    private final CommonService commonService;

    WebServiceController(DynamicWebService dynamicWebService, CommonService commonService) {
        this.dynamicWebService = dynamicWebService;
        this.commonService = commonService;
    }

    @GetMapping("/getEndpoints")
    public Result<List<EndpointResponseDTO>> getEndpoints() {
        List<EndpointDTO> endpoints = dynamicWebService.getEndpoints();
        List<EndpointResponseDTO> endpointResponseList = endpoints.stream().map(endpointDTO -> {
            EndpointResponseDTO response = new EndpointResponseDTO();
            BeanUtils.copyProperties(endpointDTO, response);
            return response;
        }).toList();
        return Result.success(endpointResponseList);
    }

    @PostMapping("/saveWebService")
    public Result<EndpointResponseDTO> saveWebService(@RequestBody WebServiceRequestDTO request) {
        log.info("Save web service: {}", request);

        if (StringUtils.isBlank(request.getPublishUri())) {
            log.error("PublishUri is blank");
        }
        if (StringUtils.isBlank(request.getBeanName())) {
            log.error("BeanName is blank");
        }
        if (StringUtils.isBlank(request.getClassPath())) {
            log.error("ClassPath is blank");
        }

        if (StringUtils.isBlank(request.getPublishUri()) || StringUtils.isBlank(request.getBeanName()) || StringUtils.isBlank(request.getClassPath())) {
            return Result.failure(ResultStatus.BAD_REQUEST);
        }

        EndpointDTO endpointDTO = new EndpointDTO();
        BeanUtils.copyProperties(request, endpointDTO);

        try {
            dynamicWebService.saveWebService(endpointDTO);
        } catch (Exception e) {
            log.error("Register web service failed", e);
            return Result.failure(ResultStatus.BAD_REQUEST);
        }

        EndpointResponseDTO response = new EndpointResponseDTO();
        BeanUtils.copyProperties(endpointDTO, response);
        return Result.success(response);
    }

    @PostMapping("/updateWebService")
    public Result<EndpointResponseDTO> updateWebService(@RequestBody WebServiceRequestDTO request) {
        log.info("Update web service: {}", request);
        StringBuilder errorMessage = new StringBuilder();

        if (StringUtils.isBlank(request.getPublishUri())) {
            errorMessage.append("PublishUri is blank; ");
        }
        if (StringUtils.isBlank(request.getBeanName())) {
            errorMessage.append("BeanName is blank; ");
        }
        if (StringUtils.isBlank(request.getJarFileId())) {
            errorMessage.append("JarFileId is blank; ");
        }
        if (StringUtils.isBlank(request.getClassPath())) {
            errorMessage.append("ClassPath is blank; ");
        }

        if (!errorMessage.isEmpty()) {
            log.error(errorMessage.toString());
            return Result.failure(ResultStatus.BAD_REQUEST);
        }

        EndpointDTO newEndpointDTO = new EndpointDTO();
        EndpointDTO endpointDTO = dynamicWebService.getEndpoint(request.getId(), null);
        dynamicWebService.disabledWebService(endpointDTO);

        BeanUtils.copyProperties(request, newEndpointDTO);
        newEndpointDTO.setIsActive(false);
        dynamicWebService.updateWebService(newEndpointDTO);
        dynamicWebService.updateJarFileStatus(endpointDTO.getJarFileId(), JarFileStatus.INACTIVE);

        if (!endpointDTO.getPublishUri().equals(newEndpointDTO.getPublishUri())) {
            dynamicWebService.removeWebService(endpointDTO.getPublishUri(), endpointDTO.getJarFileId());
            commonService.updateMockResponse(endpointDTO.getPublishUri(), newEndpointDTO.getPublishUri());
        }

        if (!endpointDTO.getJarFileId().equals(newEndpointDTO.getJarFileId())) {
            dynamicWebService.updateJarFileStatus(endpointDTO.getJarFileId(), JarFileStatus.DELETED);
        }
        EndpointResponseDTO response = new EndpointResponseDTO();
        BeanUtils.copyProperties(newEndpointDTO, response);
        return Result.success(response);
    }

    @DeleteMapping("/removeWebService")
    public Result<String> removeWebService(@RequestBody String[] publishUris) {
        EndpointDTO endpointDTO;
        for (String publishUri : publishUris) {
            endpointDTO = dynamicWebService.getEndpoint(null, publishUri);
            dynamicWebService.disabledWebService(endpointDTO);
            dynamicWebService.removeWebService(publishUri, endpointDTO.getJarFileId());
        }
        return Result.success(StringUtils.EMPTY);
    }

    @GetMapping("/switchWebService")
    public Result<String> switchWebService(@RequestParam String publishUri, @RequestParam Boolean isActive) {
        if (StringUtils.isNotBlank(publishUri) && isActive != null) {
            if (isActive) {
                dynamicWebService.enabledWebService(publishUri);
            } else {
                EndpointDTO endpointDTO = dynamicWebService.getEndpoint(null, publishUri);
                dynamicWebService.disabledWebService(endpointDTO);
            }
        }
        return Result.success(StringUtils.EMPTY);
    }

    @PostMapping("/genWsdlObj")
    public ResponseEntity<byte[]> genWsdlObj(@RequestParam(value = "wsdlUrl", required = false) String wsdlUrl,
                                             @RequestParam(value = "file", required = false) MultipartFile wsdlFile,
                                             @RequestParam(required = false) String packageName) {
        byte[] zipContent = dynamicWebService.generateWsdlToObjects(wsdlUrl, wsdlFile, packageName);

        if (zipContent.length == 0) {
            return ResponseEntity.noContent().build();
        }

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=generated_wsdl_object.zip")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(zipContent);
    }

}
