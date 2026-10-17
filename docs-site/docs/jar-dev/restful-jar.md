---
id: restful-jar
title: 開發 RESTful JAR
description: '以 company-restful 為藍本開發 RESTful JAR：專案結構、build.gradle.kts、Controller 規則清單與 @ResponseResultBody 的影響。'
sidebar_label: 開發 RESTful JAR
---

# 開發 RESTful JAR

以 `restfuls/company-restful` 為藍本，從零建立一個可動態載入的 REST 服務。

## 1. 專案結構

```
my-restful/
├── build.gradle.kts
├── settings.gradle.kts
└── src/main/
    ├── lib/base.jar
    └── java/com/mycorp/
        ├── controller/OrderController.java
        └── dto/
            ├── OrderQuery.java
            └── OrderResult.java
```

## 2. build.gradle.kts

```kotlin
plugins {
    java
    id("org.springframework.boot") version "3.2.5"
    id("io.spring.dependency-management") version "1.1.5"
}

group = "com.mycorp"
version = "1.0"

java {
    toolchain { languageVersion = JavaLanguageVersion.of(17) }
}

repositories { mavenCentral() }

dependencies {
    // 與後端相同的 starter，只用於編譯；執行期由後端提供
    implementation("io.github.a09090443:base-spring-boot-starter:3.2.5.4")
    implementation("io.github.a09090443:web-spring-boot-starter:3.2.5.1")
    implementation(files("src/main/lib/base.jar"))

    compileOnly("org.projectlombok:lombok:1.18.32")
    annotationProcessor("org.projectlombok:lombok:1.18.32")
}
```

:::tip 不用 Spring Boot Plugin 也可以
Spring Boot Plugin 在這裡只是為了套用版本管理。若改用純 `java` plugin 並自行指定版本，`build` 就只會產生一般 JAR，不會有 `-plain` 後綴，也不會因缺少 `main` 類別而在 `bootJar` 失敗。
:::

## 3. 撰寫 Controller

```java title="src/main/java/com/mycorp/controller/OrderController.java"
package com.mycorp.controller;

import com.dynamicapi.jarbase.RestfulBase;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mycorp.dto.OrderQuery;
import com.mycorp.dto.OrderResult;
import com.zipe.annotation.ResponseResultBody;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@ResponseResultBody                       // 選用：包成 {code, message, data}
@RequestMapping(value = "/order", produces = MediaType.APPLICATION_JSON_VALUE)
public class OrderController extends RestfulBase {

    private static final String PUBLISH_URI = "order";   // 必須等於 @RequestMapping 第一段
    private final ObjectMapper objectMapper = new ObjectMapper();

    @PostMapping("/query")
    public OrderResult query(@RequestBody OrderQuery query) throws Exception {
        String condition = objectMapper.writeValueAsString(query);
        String content = findByPrimaryKey(PUBLISH_URI, "query", condition, String.class);
        if (content == null || content.isBlank()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No mock response: " + condition);
        }
        return objectMapper.readValue(content, OrderResult.class);
    }

    @GetMapping("/{orderId}")
    public OrderResult get(@PathVariable String orderId) throws Exception {
        // condition 不一定要是 JSON，用路徑參數也可以
        String content = findByPrimaryKey(PUBLISH_URI, "get", orderId, String.class);
        return objectMapper.readValue(content, OrderResult.class);
    }
}
```

## 規則清單

| 規則 | 原因 |
|---|---|
| 類別必須標註 `@RestController` | 沒有標註的類別啟用時會被略過，不會註冊任何路由 |
| 類別 `@RequestMapping` 第一段 = Publish URI | 啟用時檢查，不符即失敗 |
| 方法使用 `@RequestMapping`、`@GetMapping`、`@PostMapping`、`@PutMapping`、`@DeleteMapping` | 只解析這五種；`@PatchMapping` 不會被註冊 |
| 捷徑註解只會帶入路徑與 HTTP 方法 | `@GetMapping(produces=...)` 等屬性會被忽略，需要時改用 `@RequestMapping` |
| 方法路徑以 `/` 開頭 | 系統以字串直接串接「類別路徑 + 方法路徑」 |
| 繼承 `RestfulBase` | 取得 `findByPrimaryKey` 與注入的 `MockResponseDao` |
| 每筆 RESTful 設定只會載入一個 Controller 類別 | 想發布多個 Controller，就建立多筆 RESTful 設定（Publish URI 各自不同，各自上傳 JAR） |

## `@ResponseResultBody` 的影響

加上 `@ResponseResultBody` 時，回傳值會被包成：

```json
{ "code": 200, "message": "OK", "data": { ... } }
```

若要模擬的是第三方 API 的**原始格式**，請不要加這個註解，讓 Controller 直接回傳原始結構（或直接回傳 `ResponseEntity<String>` 把 `content` 原封不動送出）。

## 直接回傳原始內容的寫法

如果 Mock 回應本身就是完整的回應本文，最單純的寫法是不做反序列化：

```java
@PostMapping(value = "/raw", produces = MediaType.APPLICATION_JSON_VALUE)
public ResponseEntity<String> raw(@RequestBody String body) {
    String content = findByPrimaryKey(PUBLISH_URI, "raw", body.strip(), String.class);
    return content.isBlank()
            ? ResponseEntity.notFound().build()
            : ResponseEntity.ok(content);
}
```

這樣 condition 就是請求本文本身，維護回應的人可以直接貼上請求與回應，不用了解 DTO 結構。

下一步：[Condition 設計指南](./condition-design.md)、[打包、上傳與驗證](./build-deploy.md)。
