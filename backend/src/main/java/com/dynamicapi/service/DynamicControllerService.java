package com.dynamicapi.service;

import com.dynamicapi.dto.ControllerDTO;
import com.dynamicapi.enums.JarFileStatus;

import java.util.List;

public interface DynamicControllerService {

    void saveController(ControllerDTO controllerDTO);

    List<ControllerDTO> getControllers();

    ControllerDTO getController(String id);

    void updateController(ControllerDTO controllerDTO);

    void enabledController(String publishUri);

    ControllerDTO disabledController(String publishUri);

    void updateJarFileStatus(String fileId, JarFileStatus status);

    void removeController(String publishUri, String jarFileId);

    void startUpControllerProcess(String publishUri, String classPath, String jarPath);
}
