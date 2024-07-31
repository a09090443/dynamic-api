package com.dynamicapi.service;

import com.dynamicapi.dto.ControllerDTO;
import com.dynamicapi.enums.JarFileStatus;

import java.io.IOException;
import java.util.List;

public interface DynamicControllerService {

    void saveController(ControllerDTO controllerDTO);

    List<ControllerDTO> getControllers();

    ControllerDTO getController(String id, String publishUri);

    void updateController(ControllerDTO controllerDTO);

    void enabledController(String publishUri);

    ControllerDTO disabledController(ControllerDTO controllerDTO);

    void updateJarFileStatus(String fileId, JarFileStatus status);

    void removeController(String publishUri, String jarFileId);

    void startUpControllerProcess(String publishUri, String classPath, String jarPath) throws IOException;
}
