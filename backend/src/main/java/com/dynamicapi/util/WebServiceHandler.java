package com.dynamicapi.util;

import com.dynamicapi.dto.EndpointDTO;
import com.dynamicapi.enums.ClassLoaderSingletonEnum;
import com.dynamicapi.exception.WebserviceException;
import com.zipe.util.classloader.CustomClassLoader;
import com.zipe.util.string.StringConstant;
import lombok.extern.slf4j.Slf4j;
import org.apache.cxf.Bus;
import org.apache.cxf.endpoint.ServerRegistry;
import org.apache.cxf.jaxb.JAXBDataBinding;
import org.apache.cxf.jaxws.EndpointImpl;
import org.springframework.context.ApplicationContext;

import java.io.File;
import java.io.IOException;
import java.net.URL;
import java.util.HashMap;
import java.util.Map;
import java.util.Objects;

@Slf4j
public class WebServiceHandler {
    private static final String WEB_SERVICE_PREFIX = "webservice";

    public void registerWebService(EndpointDTO endpointDTO, ApplicationContext context, String fileName) throws IOException, ClassNotFoundException {

        String jarPath = "file:" + context.getEnvironment().getProperty("jar.file.dir") + fileName;
        DynamicBeanUtil dynamicBeanUtil = new DynamicBeanUtil(context);
        try {
            CustomClassLoader classLoader = ClassLoaderSingletonEnum.INSTANCE.get(endpointDTO.getPublishUri() + "_" + WEB_SERVICE_PREFIX);
            if (Objects.isNull(classLoader)) {
                classLoader = new CustomClassLoader(new URL[]{new URL(jarPath)}, this.getClass().getClassLoader());
                ClassLoaderSingletonEnum.INSTANCE.put(endpointDTO.getPublishUri() + "_" + WEB_SERVICE_PREFIX, classLoader);
            }
            Class<?> loadedClass = classLoader.loadClass(endpointDTO.getClassPath());
            this.setBeanName(context, endpointDTO.getBeanName(), loadedClass);
            EndpointImpl endpoint;
            endpoint = new EndpointImpl(context.getBean(Bus.class), dynamicBeanUtil.getBean(endpointDTO.getBeanName(), loadedClass));

            Map<String, Object> properties = new HashMap<>();
            properties.put("set-jaxb-validation-event-handler", "false");

            endpoint.setProperties(properties);

            // Set custom JAXBDataBinding
            JAXBDataBinding jaxbDataBinding = new JAXBDataBinding();
            jaxbDataBinding.setUnwrapJAXBElement(true);
            jaxbDataBinding.setMtomEnabled(true);

            // Configure namespace mapping to ignore empty namespaces
            Map<String, String> nsMap = new HashMap<>();
            nsMap.put("", "http://www.w3.org/2001/XMLSchema");
            jaxbDataBinding.setNamespaceMap(nsMap);

            endpoint.setDataBinding(jaxbDataBinding);

            endpoint.publish(StringConstant.SLASH + endpointDTO.getPublishUri());
            log.info("Web Service 註冊服務:{}, 對應 URI:{}", endpointDTO.getBeanName(), endpointDTO.getPublishUri());
        } catch (Exception e) {
            log.error("Web Service 註冊服務:{}, 失敗", endpointDTO.getBeanName(), e);
            ClassLoaderSingletonEnum.INSTANCE.remove(endpointDTO.getPublishUri() + "_" + WEB_SERVICE_PREFIX);
            throw new WebserviceException("Web Service 註冊服務失敗");
        }
    }

    public void removeWebService(String publicUrl, Bus bus, ApplicationContext context, String jarName) {
        ServerRegistry serverRegistry = bus.getExtension(ServerRegistry.class);

        serverRegistry.getServers().stream()
                .filter(server -> server.getEndpoint().getEndpointInfo().getAddress().endsWith(publicUrl))
                .findFirst()
                .ifPresent(server -> {
                    server.stop();
                    server.destroy();
                    serverRegistry.getServers().remove(server);
                });
        String jarPath = "file:" + context.getEnvironment().getProperty("jar.file.dir") + jarName;
        try {
            CustomClassLoader classLoader = ClassLoaderSingletonEnum.INSTANCE.get(publicUrl + "_" + WEB_SERVICE_PREFIX);
            if (Objects.isNull(classLoader)) {
                return;
            }
            if (new File(context.getEnvironment().getProperty("jar.file.dir") + jarName).exists()) {
                classLoader.unloadJarFile(new URL(jarPath));
            }
            classLoader.close();
            ClassLoaderSingletonEnum.INSTANCE.remove(publicUrl + "_" + WEB_SERVICE_PREFIX);
        } catch (Exception e) {
            log.error("Web Service 移除服務:{}, 失敗", publicUrl, e);
            throw new WebserviceException("移除服務失敗");
        }
    }

    private void setBeanName(ApplicationContext context, String beanName, Class<?> clazz) {
        DynamicBeanUtil dynamicBeanUtil = new DynamicBeanUtil(context);
        dynamicBeanUtil.registerBean(beanName, clazz);
    }
}
