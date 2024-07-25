package com.dynamicapi.repository;

import com.dynamicapi.entity.MockResponseEntity;
import com.dynamicapi.entity.MockResponseId;
import com.dynamicapi.enums.ServiceType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MockResponseRepository extends JpaRepository<MockResponseEntity, MockResponseId> {
    MockResponseEntity findByIdPublishUriAndIdMethodAndIdConditionAndIsActiveAndIdServiceType(String publishUri, String method, String condition, Boolean isActive, ServiceType ServiceType);
    List<MockResponseEntity> findByIdPublishUriAndIdServiceType(String publishUri, ServiceType ServiceType);
    MockResponseEntity findByUuId(String id);
}
