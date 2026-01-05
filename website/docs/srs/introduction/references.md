---
sidebar_position: 5
---

# 參考文件

本需求規格書撰寫時所依據的外部文件與規範。

## 技術規格與標準

### JAX-WS 規格
**名稱**：Java API for XML Web Services

**版本**：2.3

**連結**：https://javaee.github.io/metro-jax-ws/

**說明**：
- Java 標準 Web Service API
- 定義 SOAP Web Service 的開發規範
- 本系統使用 JAX-WS 實作 WSDL Web Service

**相關章節**：
- [Endpoint 管理](../functional-requirements/endpoint-management)

---

### JAX-RS 規格
**名稱**：Java API for RESTful Web Services

**版本**：2.1

**連結**：https://javaee.github.io/jaxrs-spec/

**說明**：
- Java 標準 RESTful API 規範
- 雖然本系統主要使用 Spring MVC，但設計參考 JAX-RS 標準

**相關章節**：
- [Restful 管理](../functional-requirements/restful-management)

---

## 框架官方文件

### Spring Framework
**版本**：6.x（隨 Spring Boot 3.2.5）

**連結**：https://spring.io/projects/spring-framework

**說明**：
- Java 企業級應用框架
- 本系統使用 Spring Boot、Spring MVC、Spring Data JPA

**相關章節**：
- [系統架構](../overview/architecture)
- [非功能需求 - 可維護性](../non-functional/maintainability)

---

### Spring Boot
**版本**：3.2.5

**連結**：https://spring.io/projects/spring-boot

**官方文件**：https://docs.spring.io/spring-boot/docs/3.2.5/reference/html/

**說明**：
- 簡化 Spring 應用程式開發
- 提供自動配置、嵌入式伺服器
- 本系統的核心框架

**相關章節**：
- [系統架構](../overview/architecture)
- SDD 第 2 章（系統總體設計）

---

### Apache CXF
**版本**：4.0+

**連結**：https://cxf.apache.org/

**官方文件**：https://cxf.apache.org/docs/

**說明**：
- 開源 Web Service 框架
- 支援 JAX-WS 與 JAX-RS
- 本系統使用 CXF 發布 WSDL Web Service

**相關章節**：
- [Endpoint 管理](../functional-requirements/endpoint-management)
- SDD 第 3.2 章（Endpoint 管理模組）

---

### Next.js
**版本**：15.5.4

**連結**：https://nextjs.org/

**官方文件**：https://nextjs.org/docs

**說明**：
- React 框架
- 支援伺服器端渲染（SSR）與靜態網站生成（SSG）
- 本系統的前端框架

**相關章節**：
- [功能需求](../functional-requirements/jar-management)

---

### React
**版本**：19+

**連結**：https://react.dev/

**官方文件**：https://react.dev/learn

**說明**：
- JavaScript UI 函式庫
- 本系統使用 React 建構前端介面

**相關章節**：
- [功能需求](../functional-requirements/jar-management)

---

### Material-UI (MUI)
**版本**：6.x

**連結**：https://mui.com/

**官方文件**：https://mui.com/material-ui/getting-started/

**說明**：
- React UI 元件庫
- 實作 Google Material Design
- 本系統使用 MUI 元件建構前端介面

**相關章節**：
- [使用性需求](../non-functional/usability)

---

## 資料庫相關

### SQLite
**版本**：3.x

**連結**：https://www.sqlite.org/

**官方文件**：https://www.sqlite.org/docs.html

**說明**：
- 嵌入式關聯式資料庫
- 無需獨立伺服器程序
- 本系統的資料儲存引擎

**相關章節**：
- [功能需求](../functional-requirements/jar-management)

---

### Hibernate / JPA
**版本**：Hibernate 6.x

**連結**：https://hibernate.org/

**JPA 規格**：https://jakarta.ee/specifications/persistence/

**說明**：
- Java ORM 框架
- 實作 JPA 規範
- 本系統使用 Spring Data JPA（基於 Hibernate）

**相關章節**：
- [功能需求](../functional-requirements/jar-management)

---

## 建置與部署工具

### Gradle
**版本**：8.7+

**連結**：https://gradle.org/

**官方文件**：https://docs.gradle.org/

**說明**：
- Java 專案建置工具
- 本系統使用 Gradle 管理依賴與建置流程

**相關章節**：
- SDD 第 8 章（部署與運維）

---

### Node.js
**版本**：22+

**連結**：https://nodejs.org/

**官方文件**：https://nodejs.org/docs/

**說明**：
- JavaScript 執行環境
- 用於執行前端建置工具

**相關章節**：
- [功能需求](../functional-requirements/jar-management)

---

## 開發規範與最佳實踐

### RESTful API 設計指南
**連結**：https://restfulapi.net/

**說明**：
- RESTful API 設計最佳實踐
- 本系統 API 設計參考此指南

**相關章節**：
- [Restful 管理](../functional-requirements/restful-management)

---

### SOAP Web Service 最佳實踐
**連結**：https://www.w3.org/TR/ws-arch/

**說明**：
- W3C Web Service 架構規範
- SOAP/WSDL 最佳實踐

**相關章節**：
- [Endpoint 管理](../functional-requirements/endpoint-management)

---

## 相關系統文件

### Dynamic API Manager SDD
**版本**：1.0.0

**說明**：
- 本系統的設計規格書
- 描述系統的技術設計與實作細節

**關聯**：
- 本 SRS 定義「要做什麼」
- SDD 定義「要怎麼做」

---

### ROADMAP.md
**位置**：專案根目錄

**說明**：
- 專案開發路線圖
- 功能規劃與優先級

**相關章節**：
- [系統目標](../overview/goals)

---

## 線上資源

### Stack Overflow
**連結**：https://stackoverflow.com/

**用途**：技術問題查詢與解決方案參考

### GitHub
**連結**：https://github.com/

**用途**：開源專案參考與套件管理

### Baeldung
**連結**：https://www.baeldung.com/

**用途**：Spring Boot 與 Java 技術教學

---

## 文件維護

### 更新頻率
參考文件的版本與連結會定期更新，確保與最新技術棧一致。

### 版本追蹤
當依賴的外部文件版本變更時，應更新本章節並記錄於[變更紀錄](../intro)。

---

## 相關章節

- [名詞定義](./glossary) - 技術名詞解釋
- [系統架構](../overview/architecture) - 技術棧概覽
