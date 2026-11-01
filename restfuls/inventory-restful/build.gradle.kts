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
    // Spring Web 與 Jackson 只用於編譯；執行期由後端提供
    compileOnly("org.springframework.boot:spring-boot-starter-web")
    implementation(files("src/main/lib/base.jar"))
}
