---
id: glossary
title: 1.4 名詞定義與縮寫
sidebar_label: 1.4 名詞定義
---

# 1.4 名詞定義與縮寫

| 名詞 | 定義 |
|---|---|
| Endpoint | 從 JAR 載入、以 Apache CXF 發布的 JAX-WS（SOAP）服務設定 |
| RESTful / Controller | 從 JAR 載入、註冊到 Spring MVC 的 `@RestController` 設定 |
| Publish URI | 服務的發布名稱。SOAP 為 `/webservice/{publishUri}`；RESTful 為 Controller 類別路徑第一段。也是 Mock 回應的分組鍵 |
| Bean 名稱 | Endpoint 實作類別註冊到 Spring 容器時使用的名稱 |
| Class 路徑 | 要載入之類別的完整名稱（FQCN） |
| JAR 檔案 | 使用者上傳、內含自訂服務類別的 Java Archive；系統以 `{UUID}.jar` 儲存於檔案系統 |
| plain JAR | 只含專案自身類別、不含相依套件的一般 JAR（Gradle Spring Boot Plugin 產出的 `-plain.jar`） |
| Mock 回應（Response） | 存於 `MOCK_RESPONSE` 的預設回應內容 |
| method | Mock 回應鍵之一，由 JAR 程式定義，通常為方法名稱 |
| condition | Mock 回應鍵之一，由 JAR 程式依請求產生的情境字串 |
| Service Type | Mock 回應所屬服務類型：`ENDPOINT` 或 `RESTFUL` |
| 啟用／停用（Active） | Endpoint、RESTful、Mock 回應的生效狀態 |
| base-jar | 提供 `WebserviceBase`、`RestfulBase`、`MockResponseDao` 的編譯期相依函式庫 |
| ClassLoader | Java 類別載入器；本系統為每個服務建立獨立的 `CustomClassLoader` |
| CDATA 處理（Ignore CDATA） | Endpoint 選項，啟用後以攔截器還原訊息中被跳脫的 `<`、`>` |
| WSDL | Web Services Description Language，描述 SOAP 服務的 XML 文件 |
| CXF | Apache CXF，本系統使用的 JAX-WS 實作 |
| SSE | Server-Sent Events，用於日誌即時串流 |
| SRS / SDD | 軟體需求規格書／軟體設計規格書 |
