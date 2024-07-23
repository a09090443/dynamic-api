package com.dynamicapi.repository;

import com.dynamicapi.entity.JarFileEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface JarFileRepository extends JpaRepository<JarFileEntity, String> {
}
