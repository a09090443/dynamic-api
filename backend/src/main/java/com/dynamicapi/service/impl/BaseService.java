package com.dynamicapi.service.impl;

import com.dynamicapi.entity.JarFileEntity;
import com.dynamicapi.enums.JarFileStatus;
import com.dynamicapi.exception.WebserviceException;
import com.dynamicapi.repository.JarFileRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationContext;

import java.io.File;

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
