---
id: acceptance
title: 7–8. 驗收、測試與附錄
sidebar_label: 7–8. 驗收與附錄
---

# 7. 驗收與測試範圍

## 7.1 驗收準則（Go / No-Go）

| # | 準則 | 驗證方式 |
|---|---|---|
| AC-01 | 範例 `company-restful` 可在不重啟的情況下完成上傳、建立、啟用、設定回應並呼叫成功 | 依 [快速上手](../guide/quick-start.md) 執行 |
| AC-02 | 範例 `company-endpoint` 可取得 WSDL 並以 SOAP 請求取得 Mock 回應 | Postman 集合 `Company_*` 請求 |
| AC-03 | 停用服務後無法呼叫，重新啟用後恢復 | 手動 |
| AC-04 | 重啟後先前啟用的服務可直接呼叫 | 重啟後執行 AC-01 / AC-02 的呼叫步驟 |
| AC-05 | 回應停用後同一請求不再命中 | 手動 |
| AC-06 | 生產模式單一 JAR 可提供管理介面 | `bootJar` 後 `java -jar` 開啟 `/dynamic-api/` |

## 7.2 測試範圍與優先級

| 優先級 | 範圍 |
|---|---|
| P0 | FR-JAR-001、FR-EP-001～003、FR-RS-001～003、FR-MR-001、FR-MR-004、FR-MR-006、FR-EP-007、FR-RS-007 |
| P1 | FR-EP-004～006、FR-RS-004～006、FR-MR-002、FR-MR-003、FR-MR-005、FR-JAR-002 |
| P2 | FR-EP-008、FR-MR-007、FR-MR-008、FR-TOOL-001、FR-TOOL-002、FR-RS-008 |

## 7.3 已知問題（驗收時需排除或確認）

| 編號 | 問題 | 相關需求 |
|---|---|---|
| KI-01 | 前端開發模式 API 代理路由已移除 | NFR-MNT-04 |
| KI-02 | 變更 Publish URI 但沿用 JAR 時，JAR 檔被刪除 | FR-JAR-002、FR-EP-004、FR-RS-004 |
| KI-03 | WSDL 工具 URL 模式欄位名稱不一致 | FR-TOOL-001 |
| KI-04 | Actuator `show-mappings` 未開放 | FR-RS-008 |
| KI-05 | 前端建置任務僅支援 Windows | NFR-MNT-04 |
| KI-06 | `test-api` 頁面呼叫已不存在的代理路徑 | — |

# 8. 附錄

## 8.1 需求追蹤表

| 需求 | 設計（SDD） | 管理 API | 使用者文件 |
|---|---|---|---|
| FR-JAR-001～002 | [資料設計](../sdd/data.md)、[模組設計](../sdd/modules.md) | `POST /common/uploadJarFile` | [管理 Endpoint](../guide/endpoint.md) |
| FR-EP-001～008 | [動態載入設計](../sdd/dynamic-loading.md) | `/ws/*` | [管理 Endpoint](../guide/endpoint.md) |
| FR-RS-001～008 | [動態載入設計](../sdd/dynamic-loading.md) | `/api/*` | [管理 RESTful](../guide/restful.md) |
| FR-MR-001～008 | [Mock 回應機制](../sdd/mock-engine.md) | `/common/*Response*` | [管理 Mock 回應](../guide/mock-response.md) |
| FR-TOOL-001 | [模組設計](../sdd/modules.md) | `POST /ws/genWsdlObj` | [WSDL 轉 Java 工具](../guide/wsdl-tool.md) |
| FR-TOOL-002 | [模組設計](../sdd/modules.md) | `GET /common/logs/stream` | [疑難排解](../guide/troubleshooting.md) |

## 8.2 變更紀錄

見 [0. 文件資訊](./intro.md#變更紀錄)。
