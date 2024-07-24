package com.dynamicapi.service.impl;

import com.dynamicapi.dto.ControllerDTO;
import com.dynamicapi.entity.ControllerEntity;
import com.dynamicapi.entity.JarFileEntity;
import com.dynamicapi.enums.ClassLoaderSingletonEnum;
import com.dynamicapi.enums.JarFileStatus;
import com.dynamicapi.exception.ControllerException;
import com.dynamicapi.jdbc.ControllerJDBC;
import com.dynamicapi.model.ControllerModel;
import com.dynamicapi.repository.ControllerRepository;
import com.dynamicapi.service.DynamicControllerService;
import com.zipe.enums.ResourceEnum;
import com.zipe.jdbc.criteria.Conditions;
import com.zipe.util.classloader.CustomClassLoader;
import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang.StringUtils;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.RequestMappingInfo;
import org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerMapping;

import java.io.File;
import java.lang.reflect.Method;
import java.net.URL;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
public class DynamicControllerServiceImpl extends BaseService implements DynamicControllerService {

    private final RequestMappingHandlerMapping requestMappingHandlerMapping;

    private final ControllerRepository controllerRepository;

    private final ControllerJDBC controllerJDBC;

    public DynamicControllerServiceImpl(RequestMappingHandlerMapping requestMappingHandlerMapping,
                                        ControllerRepository controllerRepository,
                                        ControllerJDBC controllerJDBC) {
        this.requestMappingHandlerMapping = requestMappingHandlerMapping;
        this.controllerRepository = controllerRepository;
        this.controllerJDBC = controllerJDBC;
    }

    @Override
    @Transactional(rollbackOn = ControllerException.class)
    public void saveController(ControllerDTO controllerDTO) {
        ControllerEntity entity = new ControllerEntity();
        BeanUtils.copyProperties(controllerDTO, entity);
        entity.setUuId(UUID.randomUUID().toString());
        entity.setIsActive(Boolean.FALSE);
        controllerDTO.setId(entity.getUuId());
        JarFileEntity jarFileEntity = getJarFile(controllerDTO.getJarFileId());

        jarFileEntity.setStatus(JarFileStatus.ACTIVE);
        try {
            jarFileRepository.save(jarFileEntity);

            controllerRepository.save(entity);
        } catch (Exception e) {
            // 處理實體已經存在的異常
            throw new ControllerException("儲存 Controller 失敗", e);
        }
        controllerDTO.setJarFileName(jarFileEntity.getName());
    }

    @Override
    public List<ControllerDTO> getControllers() {

        ResourceEnum resource = ResourceEnum.SQL.getResource(ControllerJDBC.SQL_SELECT_CONTROLLER_RELATED_JAR_FILE);
        List<ControllerModel> controllerModelList = controllerJDBC.queryForList(resource, new Conditions(), ControllerModel.class);

        return controllerModelList.stream().map(controller -> {
            ControllerDTO dto = new ControllerDTO();
            BeanUtils.copyProperties(controller, dto);
            return dto;
        }).toList();
    }

    @Override
    public ControllerDTO getController(String publishUri) {
        ResourceEnum resource = ResourceEnum.SQL.getResource(ControllerJDBC.SQL_SELECT_CONTROLLER_RELATED_JAR_FILE);
        Conditions conditions = new Conditions();
        conditions.and().equal("PUBLISH_URI", publishUri);
        ControllerModel controllerModel = controllerJDBC.queryForBean(resource, conditions, ControllerModel.class);
        ControllerDTO dto = new ControllerDTO();
        BeanUtils.copyProperties(controllerModel, dto);
        return dto;
    }

    @Override
    @Transactional(rollbackOn = ControllerException.class)
    public void updateController(ControllerDTO controllerDTO) {
        saveController(controllerDTO);
    }

    @Override
    @Transactional(rollbackOn = Exception.class)
    public void enabledController(String publishUri) {
        ControllerEntity controllerEntity = controllerRepository.findById(publishUri).orElseThrow(() -> new ControllerException("找不到對應的 Controller"));
        JarFileEntity jarFileEntity = getJarFile(controllerEntity.getJarFileId());

        try {
            this.startUpControllerProcess(controllerEntity.getPublishUri(), controllerEntity.getClassPath(), getJarFilePath(jarFileEntity.getName()));
            controllerEntity.setIsActive(Boolean.TRUE);
            controllerRepository.save(controllerEntity);
        } catch (Exception e) {
            log.error("Controller 註冊服務:{}, 失敗", publishUri, e);
            throw new ControllerException(e.getMessage(), e);
        }
    }

    @Override
    @Transactional(rollbackOn = Exception.class)
    public ControllerDTO disabledController(String publishUri) {
        ControllerDTO controllerDTO = getController(publishUri);

        try {
            ControllerEntity controllerEntity = new ControllerEntity();
            BeanUtils.copyProperties(controllerDTO, controllerEntity);
            controllerEntity.setUuId(controllerDTO.getId());
            controllerEntity.setIsActive(Boolean.FALSE);
            controllerRepository.save(controllerEntity);

            CustomClassLoader classLoader = ClassLoaderSingletonEnum.INSTANCE.get(publishUri);
            if (Objects.isNull(classLoader)) {
                return controllerDTO;
            }
            Class<?> loadedClass = classLoader.loadClass(controllerEntity.getClassPath());
            RequestMapping classRequestMapping = loadedClass.getAnnotation(RequestMapping.class);
            String routePath = classRequestMapping != null ? classRequestMapping.value()[0] : "";
            for (Method method : loadedClass.getDeclaredMethods()) {
                RequestMappingInfo mappingInfo = getMappingForMethod(method, routePath);
                Optional.ofNullable(mappingInfo)
                        .ifPresent(requestMappingHandlerMapping::unregisterMapping);
            }
            try {
                ClassLoaderSingletonEnum.INSTANCE.remove(publishUri);
                classLoader.unloadJarFile(new URL(getJarFilePath(controllerDTO.getJarFileName())));
                classLoader.close();
            } catch (Exception e) {
                log.error("Controller 卸載Jar:{}, 失敗", getJarFilePath(controllerDTO.getJarFileName()), e);
            }
        } catch (Exception e) {
            log.error("Controller 卸載服務:{}, 失敗", controllerDTO.getClassPath(), e);
            throw new ControllerException("Controller 卸載服務失敗", e);
        }
        return controllerDTO;
    }

    @Override
    public void updateJarFileStatus(String fileId, JarFileStatus status) {
        JarFileEntity jarFileEntity = getJarFile(fileId);
        jarFileEntity.setStatus(status);
        jarFileRepository.save(jarFileEntity);
        if (status.equals(JarFileStatus.DELETED)) {
            File file = new File(jarFileDir + jarFileEntity.getName());
            if (file.exists()) {
                file.delete();
            }
        }
    }

    @Override
    @Transactional(rollbackOn = Exception.class)
    public void removeController(String publishUri, String jarFileId) {
        try {
            controllerRepository.deleteById(publishUri);
            updateJarFileStatus(jarFileId, JarFileStatus.DELETED);
        } catch (Exception e) {
            log.error("移除 Controller 失敗:{}", e.getMessage(), e);
            throw new ControllerException(e.getMessage());
        }
    }

    @Override
    public void startUpControllerProcess(String publishUri, String classPath, String jarPath) {
        try {
            CustomClassLoader classLoader = ClassLoaderSingletonEnum.INSTANCE.get(publishUri);
            if (Objects.isNull(classLoader)) {
                classLoader = new CustomClassLoader(new URL[]{new URL(jarPath)}, this.getClass().getClassLoader());
                ClassLoaderSingletonEnum.INSTANCE.put(publishUri, classLoader);
            }
            Class<?> loadedClass = classLoader.loadClass(classPath);
            if (loadedClass.isAnnotationPresent(RestController.class)) {
                Object controllerInstance = context.getAutowireCapableBeanFactory().createBean(loadedClass);
                RequestMapping classRequestMapping = loadedClass.getAnnotation(RequestMapping.class);
                String routePath = classRequestMapping != null ? classRequestMapping.value()[0] : "";

                if (StringUtils.isNotBlank(routePath) && !routePath.split("/")[1].equals(publishUri)) {
                    throw new ControllerException("Controller 註冊服務失敗，路徑不一致");
                }

                for (Method method : loadedClass.getDeclaredMethods()) {
                    RequestMappingInfo mappingInfo = getMappingForMethod(method, routePath);
                    Optional.ofNullable(mappingInfo).ifPresent(info -> requestMappingHandlerMapping.registerMapping(info, controllerInstance, method));
                }
            }
        } catch (Exception e) {
            log.error("Controller 註冊服務:{}, 失敗", publishUri, e);
            throw new ControllerException(e.getMessage());
        }
    }

    private RequestMappingInfo getMappingForMethod(Method method, String classLevelPath) {
        RequestMappingInfo.Builder mappingBuilder = null;

        if (method.isAnnotationPresent(RequestMapping.class)) {
            RequestMapping methodMapping = method.getAnnotation(RequestMapping.class);
            mappingBuilder = RequestMappingInfo
                    .paths(combine(classLevelPath, methodMapping.value()))
                    .methods(methodMapping.method())
                    .params(methodMapping.params())
                    .headers(methodMapping.headers())
                    .consumes(methodMapping.consumes())
                    .produces(methodMapping.produces());
        } else if (method.isAnnotationPresent(GetMapping.class)) {
            GetMapping methodMapping = method.getAnnotation(GetMapping.class);
            mappingBuilder = RequestMappingInfo
                    .paths(combine(classLevelPath, methodMapping.value()))
                    .methods(RequestMethod.GET);
        } else if (method.isAnnotationPresent(PostMapping.class)) {
            PostMapping methodMapping = method.getAnnotation(PostMapping.class);
            mappingBuilder = RequestMappingInfo
                    .paths(combine(classLevelPath, methodMapping.value()))
                    .methods(RequestMethod.POST);
        } else if (method.isAnnotationPresent(PutMapping.class)) {
            PutMapping methodMapping = method.getAnnotation(PutMapping.class);
            mappingBuilder = RequestMappingInfo
                    .paths(combine(classLevelPath, methodMapping.value()))
                    .methods(RequestMethod.PUT);
        } else if (method.isAnnotationPresent(DeleteMapping.class)) {
            DeleteMapping methodMapping = method.getAnnotation(DeleteMapping.class);
            mappingBuilder = RequestMappingInfo
                    .paths(combine(classLevelPath, methodMapping.value()))
                    .methods(RequestMethod.DELETE);
        }

        return mappingBuilder != null ? mappingBuilder.build() : null;
    }

    private String[] combine(String classPath, String[] methodPaths) {
        if (methodPaths.length == 0) {
            return new String[]{classPath};
        }
        String[] result = new String[methodPaths.length];
        for (int i = 0; i < methodPaths.length; i++) {
            result[i] = classPath + methodPaths[i];
        }
        return result;
    }

}
