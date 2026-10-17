---
paths:
  - "backend/src/main/java/com/dynamicapi/controller/**"
  - "backend/src/main/java/com/dynamicapi/dto/**"
  - "backend/src/main/java/com/dynamicapi/exception/**"
  - "nextjs-dynamic-api-manager/src/services/**"
  - "nextjs-dynamic-api-manager/src/types/**"
---

# 管理 API 契約（後端 Controller ↔ 前端 services）

API 規格：`docs-site/docs/sdd/api/`。

## 回應格式

- 三個管理 Controller（`/ws`、`/api`、`/common`）都標註 `@ResponseResultBody`，回傳 `com.zipe.dto.Result`，序列化為 `{ code, message, data }`。新增端點沿用此方式，不要直接回傳裸物件或 `ResponseEntity`（檔案下載如 `genWsdlObj` 例外）。
- 輸入驗證失敗回傳 `Result.failure(ResultStatus.BAD_REQUEST)`：**HTTP 200、`code=400`**。前端 `apiClient` 依 `code !== 200` 判斷失敗，不要改成只靠 HTTP 狀態碼。
- 例外由 `GlobalExceptionHandler` 與 zipe `ResponseResultBodyAdvice` 兩個 Advice 處理（格式不一致，見 TD-06）。修改錯誤處理時要同時考慮兩者。

## 命名與參數慣例

- 路徑為動詞式（`getXxx`、`saveXxx`、`updateXxx`、`removeXxx`/`deleteXxx`、`switchXxx`），沿用既有風格。
- 查詢與切換用 `GET`；新增與修改用 `POST`；刪除用 `DELETE`，本文為 JSON 陣列。
- Endpoint / RESTful 以 `publishUri` 操作（update 例外，以 `id` 找原設定）；Mock 回應以 `id` 操作。
- 所有路徑都在 context path `/dynamic-api` 之下。前端 service 的 `BASE_PATH` 已包含 `/dynamic-api`。

## 前後端同步

修改任何 DTO 或端點時，同一次變更內要一起更新：

| 後端 | 前端 |
|---|---|
| `dto/EndpointDTO`、`EndpointResponseDTO`、`WebServiceRequestDTO` | `src/types/models.ts` 的 `Endpoint`、`src/services/endpoint.service.ts` |
| `dto/ControllerDTO`、`ControllerResponseDTO` | `Restful`、`restful.service.ts` |
| `dto/MockResponseRequestDTO`、`MockResponseResponseDTO` | `src/types/response.ts`、`response.service.ts` |
| 端點路徑、參數名稱 | 對應 service 的 URL 與參數 |

`@RequestParam` 名稱與前端送出的欄位名稱必須一致。已知不一致：`genWsdlObj` 後端讀 `wsdlUrl`、前端送 `wsdlPath`（KI-03）。

## Controller 層的編排

`updateWebService` / `updateController` 在 Controller 中編排「停用 → 儲存 → 改 JAR 狀態 → 搬移 Mock 回應」，這些步驟不在同一個交易內（TD-13）。調整順序前先讀 `docs-site/docs/sdd/workflows.md` 的 6.2。

## CORS

全域 CORS 在 `config/WebConfig.java`（允許 `http://localhost:3000`），各 Controller 另有 `@CrossOrigin("http://localhost:4200")`（舊 Angular 前端）。新增 Controller 不需要再加 `@CrossOrigin`。

## 變更後

更新 `docs-site/docs/sdd/api/` 對應頁面；若影響使用者操作，也更新 `docs-site/docs/guide/`。
