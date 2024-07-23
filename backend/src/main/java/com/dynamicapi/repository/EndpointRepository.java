package com.dynamicapi.repository;

import com.dynamicapi.entity.EndpointEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EndpointRepository extends JpaRepository<EndpointEntity, String> {
    EndpointEntity findByUuId(String id);

    List<EndpointEntity> findAllByIsActive(Boolean isActive);
}
