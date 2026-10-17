---
id: intro
title: 設計規格書（SDD）
description: 'SDD 的文件資訊、目的、範圍、讀者與參考文件，並提供各章節導覽。'
sidebar_label: 0–1. 文件資訊與簡介
---

# 設計規格書（SDD）

## 0. 文件資訊

| 項目 | 內容 |
|---|---|
| 系統名稱 | Dynamic API Manager |
| 文件類型 | 軟體設計規格書（SDD） |
| 版本 | 2.0 |
| 撰寫依據 | `new-frontend` 分支現行程式碼 |
| 對應需求文件 | [需求規格書（SRS）](../srs/intro.md) |

## 1. 簡介

### 1.1 文件目的

說明 Dynamic API Manager 的架構、模組、資料、介面與關鍵流程設計，讓維護者能在不通讀程式碼的情況下理解系統如何運作、修改時會影響哪些地方。

### 1.2 文件範圍

| 涵蓋 | 不涵蓋 |
|---|---|
| 後端 Spring Boot 應用的模組與動態載入機制 | 第三方函式庫（CXF、Spring）的內部實作 |
| SQLite 資料結構與遷移 | 自訂 JAR 的業務邏輯 |
| 管理 API 規格 | 舊版 Angular 前端（`frontend/`） |
| Next.js 管理介面的架構與建置整合 | UI 視覺規範 |
| 部署、設定與已知技術債 | |

### 1.3 讀者

後端開發人員、前端開發人員、架構師、維運人員、需要撰寫自訂 JAR 的開發人員。

### 1.4 參考文件

| 文件 | 說明 |
|---|---|
| [SRS](../srs/intro.md) | 功能與非功能需求、需求編號 |
| [JAR 開發指南](../jar-dev/overview.md) | 自訂 JAR 的開發規範 |
| `backend/build.gradle` | 相依套件與前端建置任務 |
| `backend/src/main/resources/db.migration/` | 資料庫遷移腳本 |
| [zipe-spring-boot-starters](https://a09090443.github.io/zipe-spring-boot-starters/) | 後端使用的 base / web / db / web-service starter |

## 章節導覽

| 章節 | 內容 |
|---|---|
| [2. 系統總體設計](./architecture.md) | 架構、部署拓撲、技術棧、設計限制 |
| [3.1 後端模組](./modules.md) | 套件分層與各模組職責 |
| [3.2 動態載入設計](./dynamic-loading.md) | ClassLoader、CXF 發布、Spring MVC 動態註冊 |
| [3.3 Mock 回應機制](./mock-engine.md) | 回應查詢與 base-jar 設計 |
| [3.4 管理介面](./frontend.md) | Next.js 架構與前後端整合 |
| [4. 資料設計](./data.md) | ERD、資料表、遷移、一致性 |
| [5. 介面與 API 設計](./api/conventions.md) | 管理 API 規格 |
| [6. 業務流程](./workflows.md) | 主要流程循序圖 |
| [7. 安全性與錯誤處理](./security-errors.md) | 認證現況、錯誤處理策略 |
| [8. 部署、設定與運維](./deployment.md) | 建置流程、組態、監控 |
| [9. 設計決策與技術債](./decisions.md) | 決策理由、風險、技術債清單 |
