package com.dynamicapi.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Embeddable
public class MockResponseId implements Serializable {
    @Column(name = "PUBLISH_URI", nullable = false)
    private String publishUri;

    @Column(name = "METHOD", nullable = false)
    private String method;

    @Column(name = "CONDITION", nullable = false)
    private String condition;
}
