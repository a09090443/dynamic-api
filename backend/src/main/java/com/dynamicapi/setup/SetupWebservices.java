package com.dynamicapi.setup;

import com.dynamicapi.dto.EndpointDTO;
import com.dynamicapi.entity.EndpointEntity;
import com.dynamicapi.entity.JarFileEntity;
import com.dynamicapi.repository.EndpointRepository;
import com.dynamicapi.repository.JarFileRepository;
import com.dynamicapi.util.WebServiceHandler;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationContext;
import org.springframework.context.SmartLifecycle;
import org.springframework.stereotype.Component;

import java.io.FileNotFoundException;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicReference;

@Slf4j
@Component
public class SetupWebservices implements SmartLifecycle {

    private final EndpointRepository endpointRepository;

    private final ApplicationContext context;

    private final JarFileRepository jarFileRepository;

    public SetupWebservices(EndpointRepository endpointRepository,
                            ApplicationContext context,
                            JarFileRepository jarFileRepository) {
        this.endpointRepository = endpointRepository;
        this.context = context;
        this.jarFileRepository = jarFileRepository;
    }

    @Override
    public void start() {
        List<EndpointEntity> endpointEntities = endpointRepository.findAllByIsActive(true);
        WebServiceHandler registerWebService = new WebServiceHandler();
        AtomicReference<JarFileEntity> jarFileEntity = new AtomicReference<>();
        EndpointDTO endpointDTO = new EndpointDTO();
        Optional.ofNullable(endpointEntities).ifPresent(entities -> entities.forEach(entity -> {
            try {
                BeanUtils.copyProperties(entity, endpointDTO);

                jarFileEntity.set(jarFileRepository.findById(entity.getJarFileId()).orElseThrow(() -> new FileNotFoundException("找不到對應的 Jar 檔案")));
                registerWebService.registerWebService(endpointDTO, context, jarFileEntity.get().getName());
            } catch (Exception e) {
                entity.setIsActive(Boolean.FALSE);
                endpointRepository.save(entity);
                log.error("Web Service 註冊服務:{}, 失敗", entity.getBeanName(), e);
            }
        }));
    }

    @Override
    public void stop() {

    }

    @Override
    public boolean isRunning() {
        return false;
    }
}
