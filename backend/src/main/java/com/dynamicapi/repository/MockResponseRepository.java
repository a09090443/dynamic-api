package com.dynamicapi.repository;

import com.dynamicapi.entity.MockResponseEntity;
import com.dynamicapi.entity.MockResponseId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MockResponseRepository extends JpaRepository<MockResponseEntity, MockResponseId> {
    MockResponseEntity findByIdPublishUriAndIdMethodAndIdConditionAndIsActive(String publishUri, String method, String condition, Boolean isActive);
    List<MockResponseEntity> findByIdPublishUri(String publishUri);
    MockResponseEntity findByUuId(String id);
}
