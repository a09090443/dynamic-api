---
sidebar_position: 2
---

# 系統範圍

## 要解決的問題

### 問題 1：部署流程冗長且中斷服務
傳統的 Web Service 與 RESTful API 部署需要：
- 重新編譯
- 重新打包
- 重啟應用程式

這導致：
- **服務中斷**：重啟期間無法提供服務
- **部署時間長**：整個流程可能需要數分鐘到數十分鐘
- **風險高**：部署失敗需回滾，再次中斷服務

### 問題 2：測試環境缺乏彈性
測試環境需要快速切換不同版本的 API 實作與 Mock 回應，但傳統方式：
- **配置分散**：Mock 資料散落在多個配置檔
- **切換困難**：需要修改檔案、重啟服務
- **版本管理複雜**：難以追蹤哪個版本對應哪個測試情境

### 問題 3：Mock 回應管理混亂
多個 API 服務的 Mock 回應管理分散，導致：
- **維護困難**：需要記住每個服務的配置位置
- **一致性差**：不同服務使用不同的 Mock 格式
- **查找困難**：無法快速找到特定條件的 Mock 回應

---

## 系統涵蓋範圍

本系統提供以下功能：

### ✅ WSDL Web Service（SOAP）的動態載入與發布
- 上傳包含 Web Service 實作的 JAR 檔案
- 無需重啟即可發布 WSDL 端點
- 支援啟用/停用切換

### ✅ RESTful API Controller 的動態載入與註冊
- 上傳包含 RESTful Controller 實作的 JAR 檔案
- 無需重啟即可註冊 API 路由
- 支援啟用/停用切換

### ✅ JAR 檔案的上傳、儲存與版本管理
- 透過 Web 介面上傳 JAR 檔案
- 儲存於資料庫，支援查詢與刪除
- 追蹤 JAR 使用狀態（UNUSED / INUSED）

### ✅ Mock 回應規則的建立、編輯與切換
- 視覺化管理 Mock 回應
- 支援多條件匹配（publishUri + method + condition）
- 支援 XML 與 JSON 格式
- 快速啟用/停用回應規則

### ✅ 前端管理介面
- Endpoint 管理頁面
- Restful 管理頁面
- Response 管理頁面
- JAR 檔案上傳介面

### ✅ WSDL 轉 Java 工具（輔助開發）
- 上傳 WSDL 檔案自動產生 Java 類別
- 加速 JAR 模組開發

---

## 系統邊界（不處理的範圍）

為了保持系統簡潔與可維護性，以下功能**不在**本系統範圍內：

### ❌ 不提供 API Gateway 功能
- 流量控制（Rate Limiting）
- API Key 管理
- 請求路由（Routing）
- 負載平衡（Load Balancing）

**理由**：這些功能應由專門的 API Gateway 產品（如 Kong、Nginx）提供

### ❌ 不提供 API 版本控制與向後相容性管理
- API 版本號管理（v1、v2）
- 向後相容性檢查
- 廢棄 API 警告

**理由**：版本控制應在開發階段由開發人員管理

### ❌ 不提供分散式部署與叢集管理
- 多節點部署
- 服務發現（Service Discovery）
- 叢集同步

**理由**：初版專注於單機部署，未來可擴展

### ❌ 不提供自動化測試或 API 測試工具
- API 自動化測試
- 效能測試
- 壓力測試

**理由**：應使用專門的測試工具（如 Postman、JMeter）

### ❌ 不處理 GraphQL 或 gRPC 協定
- 僅支援 SOAP（JAX-WS）與 RESTful（HTTP）
- 不支援 GraphQL
- 不支援 gRPC

**理由**：初版專注於最常見的兩種協定

---

## 相關文件

- [系統目標](../overview/goals) - 了解系統要達成的目標
- [主要使用情境](../overview/use-cases) - 了解典型使用場景
- [功能需求](../functional-requirements/jar-management) - 詳細功能規格
