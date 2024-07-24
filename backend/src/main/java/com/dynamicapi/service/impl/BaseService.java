package com.dynamicapi.service.impl;

import com.dynamicapi.entity.JarFileEntity;
import com.dynamicapi.exception.WebserviceException;
import com.dynamicapi.repository.JarFileRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationContext;

public abstract class BaseService {
    protected ApplicationContext context;

    protected JarFileRepository jarFileRepository;

    protected String jarFileDir;

    protected JarFileEntity getJarFile(String jarFileId) {
        return jarFileRepository.findById(jarFileId).orElseThrow(() -> new WebserviceException("找不到對應的 Jar 檔案"));
    }

    protected String getJarFilePath(String fileName) {
        return "file:" + jarFileDir + fileName;
    }

    @Autowired
    public void setJarFileRepository(JarFileRepository jarFileRepository) {
        this.jarFileRepository = jarFileRepository;
    }

    @Autowired
    public void setContext(ApplicationContext context) {
        this.context = context;
    }

    @Value("${jar.file.dir}")
    public void setJarFileDir(String jarFileDir) {
        this.jarFileDir = jarFileDir;
    }
}
