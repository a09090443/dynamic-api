package com.dynamicapi.service;

import com.dynamicapi.jdbc.ControllerJDBC;
import com.dynamicapi.repository.ControllerRepository;
import com.dynamicapi.repository.JarFileRepository;
import com.dynamicapi.service.impl.DynamicControllerServiceImpl;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.support.DefaultListableBeanFactory;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerMapping;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;

class DynamicControllerMappingInjectionTest {
    @Test
    void selectsMvcMappingWithoutConstructorParameterNames() {
        RequestMappingHandlerMapping mvcMapping = mock(RequestMappingHandlerMapping.class);
        RequestMappingHandlerMapping actuatorMapping = mock(RequestMappingHandlerMapping.class);

        new ApplicationContextRunner()
                .withInitializer(context -> {
                    DefaultListableBeanFactory beanFactory = (DefaultListableBeanFactory) context.getBeanFactory();
                    beanFactory.setParameterNameDiscoverer(null);
                    beanFactory.registerSingleton("requestMappingHandlerMapping", mvcMapping);
                    beanFactory.registerSingleton("controllerEndpointHandlerMapping", actuatorMapping);
                    beanFactory.registerSingleton("controllerRepository", mock(ControllerRepository.class));
                    beanFactory.registerSingleton("controllerJDBC", mock(ControllerJDBC.class));
                    beanFactory.registerSingleton("jarFileRepository", mock(JarFileRepository.class));
                })
                .withPropertyValues("jar.file.dir=./build/test-jars/")
                .withBean(DynamicControllerServiceImpl.class)
                .run(context -> {
                    assertThat(context).hasNotFailed();
                    assertThat(ReflectionTestUtils.getField(context.getBean(DynamicControllerServiceImpl.class),
                            "requestMappingHandlerMapping")).isSameAs(mvcMapping);
                });
    }
}
