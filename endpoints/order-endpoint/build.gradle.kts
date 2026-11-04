plugins {
    java
    id("org.springframework.boot") version "3.2.5"
    id("io.spring.dependency-management") version "1.1.5"
}

group = "com.sample"
version = "1.0"

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(17)
    }
}

repositories {
    mavenCentral()
}

dependencies {
    // 以下套件只用於編譯；執行期由後端提供（版本與 backend/build.gradle 一致）
    // 排除 jasperreports：本範例用不到，且它需要的 openpdf:1.3.30.jaspersoft.3 不在 Maven Central
    compileOnly("io.github.a09090443:web-service-spring-boot-starter:3.2.5.3") {
        exclude(group = "net.sf.jasperreports")
    }
    compileOnly("jakarta.xml.bind:jakarta.xml.bind-api:4.0.2")
    implementation(files("src/main/lib/base.jar"))
}
