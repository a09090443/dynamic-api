package com.dynamicapi.setup;

import com.dynamicapi.entity.ControllerEntity;
import com.dynamicapi.entity.JarFileEntity;
import com.dynamicapi.repository.ControllerRepository;
import com.dynamicapi.repository.JarFileRepository;
import com.dynamicapi.service.DynamicControllerService;
import com.dynamicapi.util.BeanRegistrationUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationContext;
import org.springframework.context.SmartLifecycle;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;
import org.springframework.stereotype.Component;

import java.io.FileNotFoundException;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicReference;

@Slf4j
@Component
public class SetupController implements SmartLifecycle {

    private final DynamicControllerService dynamicControllerService;

    private final ControllerRepository controllerRepository;

    private final JarFileRepository jarFileRepository;

    private final ApplicationContext context;

    public SetupController(DynamicControllerService dynamicControllerService,
                           ControllerRepository controllerRepository,
                           JarFileRepository jarFileRepository,
                           ApplicationContext context) {
        this.dynamicControllerService = dynamicControllerService;
        this.controllerRepository = controllerRepository;
        this.jarFileRepository = jarFileRepository;
        this.context = context;
    }

    @Override
    public void start() {
        List<ControllerEntity> controllerEntities = controllerRepository.findAllByIsActive(Boolean.TRUE);
        AtomicReference<JarFileEntity> jarFileEntity = new AtomicReference<>();
        AtomicReference<String> jarPath = new AtomicReference<>("file:" + context.getEnvironment().getProperty("jar.file.dir") );
        Optional.ofNullable(controllerEntities).ifPresent(controllers -> controllers.forEach(controller -> {
            try {
                jarFileEntity.set(jarFileRepository.findById(controller.getJarFileId()).orElseThrow(() -> new FileNotFoundException("找不到對應的 Jar 檔案")));
                jarPath.set(jarPath + jarFileEntity.get().getName());
                dynamicControllerService.startUpControllerProcess(controller.getPublishUri(), controller.getClassPath(), jarPath.get());
            } catch (Exception e) {
                controller.setIsActive(Boolean.FALSE);
                controllerRepository.save(controller);
                log.error("Controller 註冊服務:{}, 失敗", controller.getPublishUri(), e);
            }
        }));
        AnnotationConfigApplicationContext annoScan = new AnnotationConfigApplicationContext();
        String[] basePackages = {"com.company"};
        try {
            // 使用工具类扫描并注册 Bean
            BeanRegistrationUtil.scanAndRegisterBeans(basePackages, annoScan);

            // 刷新上下文
            annoScan.refresh();

            // 使用 context 获取 Beans
            // MyBean myBean = context.getBean(MyBean.class);
        } catch (IllegalStateException e) {
            System.err.println("Failed to register beans: " + e.getMessage());
        }
    }

    @Override
    public void stop() {

    }

    @Override
    public boolean isRunning() {
        return false;
    }
}
