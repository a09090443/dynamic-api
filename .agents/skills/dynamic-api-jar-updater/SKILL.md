---
name: dynamic-api-jar-updater
description: 'Use when uploading, replacing, or deploying an already-built JAR to a specified existing Dynamic API Manager RESTful service or SOAP Endpoint; update the existing service record instead of creating a new one.'
argument-hint: '[服務類型、publishUri、已完成的 JAR 路徑]'
---

# Dynamic API JAR Updater

將已完成的 JAR 套用到使用者指定的既有 Dynamic API Manager RESTful 或 SOAP 服務。此 skill 專注於更新和部署，不負責從 API 文件或 WSDL 開發、建置 JAR。

## 適用情境

- 使用者提供已建置的 `.jar`，要更新已建立的 RESTful 服務或 SOAP Endpoint。
- 使用者指定既有服務的 `publishUri`、服務類型或管理介面資料，要求替換服務 JAR。
- 使用者需要操作既有服務的 JAR 更新 API，或需要管理介面上的更新步驟。

## 必要輸入

- 已完成的 JAR 檔案路徑。
- 服務類型：`RESTFUL` 或 `ENDPOINT`（SOAP）。
- 既有服務的 `publishUri`。若同名服務在目標清單中無法唯一辨識，先釐清，不可猜測。
- 可連線的 Dynamic API Manager 管理 API base URL，或使用者要採用管理介面手動操作。

若缺少 JAR 路徑、服務類型、目標服務或可用的部署方式，先只詢問缺少的必要資訊；不可自行建立新服務來繞過。

## 更新流程

1. **確認目標與目前狀態**
   - 從 `docs-site/docs/guide/restful.md`、`docs-site/docs/guide/endpoint.md`、`docs-site/docs/jar-dev/build-deploy.md` 確認當前操作規則；需要 API 欄位時參考 `docs-site/docs/sdd/api/restful.md`、`endpoint.md`、`common.md`。
   - 先確認管理 API base URL 與服務類型。RESTful 使用 `/dynamic-api/api`，SOAP Endpoint 使用 `/dynamic-api/ws`，共用上傳 API 使用 `/dynamic-api/common`。不要假設主機、port 或環境。
   - 查詢既有服務清單：`GET /api/getControllers` 或 `GET /ws/getEndpoints`。檢查包裝回應的 `code`，依 `publishUri` 找到唯一目標，記錄原始 `id`、`classPath`、`jarFileId`、`isActive`；SOAP 另記錄 `beanName`、`ignoreCdata`。
   - 若服務清單查不到唯一目標、環境不明，或使用者指定值與清單不符，停止變更並請使用者確認。絕不可呼叫 `saveController` 或 `saveWebService` 來替代更新。

2. **檢查新 JAR**
   - 確認指定檔案存在、副檔名為 `.jar`，且可讀取；管理 API 上傳限制為 100 MB。
   - 用 `jar tf <jar-path>` 確認它是可載入的普通 JAR：類別應在 JAR 根目錄，不應位於 `BOOT-INF/classes/`，也不應包含後端提供的 `com/dynamicapi/**` 類別。
   - 確認目標 `classPath` 存在於新 JAR。REST 使用 Controller 完整類別名稱；SOAP 使用 Endpoint 實作類別完整名稱，不是 SEI。若要更換 `classPath`，只能使用使用者提供或能從 JAR 唯一確認的類別；有歧義就先詢問。

3. **上傳 JAR**
   - 呼叫 `POST /common/uploadJarFile`，以 `multipart/form-data` 欄位 `file` 傳送檔案。
   - 確認回應的 `code` 為 `200`，取出 `data.jarFileId`，供更新既有服務使用。系統會產生新的 UUID 檔名，不保留原始檔名。
   - 上傳失敗時停止，不要更新服務。上傳成功但後續更新失敗時，回報已上傳的 `jarFileId`；不要改用新增 API，也不要自行刪除未被服務引用的 JAR。

4. **更新原服務紀錄**
   - 保留原服務的 `publishUri`，除非使用者明確要求更名。更改 URI 會搬移 Mock 回應，可能有資料影響；遇到此需求先說明並確認。
   - RESTful 呼叫 `POST /api/updateController`，傳入 JSON：

     ```json
     {
       "id": "既有服務 id",
       "publishUri": "既有 publishUri",
       "classPath": "Controller 完整類別名稱",
       "jarFileId": "新上傳回傳的 jarFileId"
     }
     ```

   - SOAP Endpoint 呼叫 `POST /ws/updateWebService`，傳入 JSON，保留現有 `beanName`、`ignoreCdata`，必要時按使用者明確要求更新 `classPath`：

     ```json
     {
       "id": "既有服務 id",
       "publishUri": "既有 publishUri",
       "beanName": "既有 beanName",
       "classPath": "Endpoint 實作類別完整名稱",
       "jarFileId": "新上傳回傳的 jarFileId",
       "ignoreCdata": false
     }
     ```

   - 確認 HTTP 與回應 `code` 均表示成功，並核對回傳的 `id`、`publishUri`、`jarFileId`。更新後服務會變成停用；Mock 回應在 URI 不變時保留。

5. **恢復原啟用狀態並驗證**
   - 若服務更新前為啟用狀態，更新成功後呼叫 `GET /api/switchController?publishUri={publishUri}&isActive=true` 或 `GET /ws/switchWebService?publishUri={publishUri}&isActive=true`，恢復原狀態。若原本停用，保持停用；使用者要求維持停用時也不得啟用。
   - 再查詢服務清單確認 `jarFileId` 已更新及 `isActive` 符合預期。啟用失敗時停止後續部署動作，回報 API 錯誤並建議檢查類別名稱、路徑、相依套件與後端日誌。
   - RESTful 可呼叫該服務路由做 smoke test；SOAP 可檢查 `/webservice/{publishUri}?wsdl` 並送出 SOAP 請求。只有實際執行成功時才宣稱已驗證。

## 管理介面手動方式

若無法連線管理 API，提供使用者此操作步驟，不要宣稱已部署：

1. 在 RESTful 或 Endpoint 清單找到指定的 `publishUri`，開啟該列的編輯功能。
2. 選擇已完成的 `-plain.jar`，並保留 `publishUri` 及其他欄位；若新 JAR 的類別名稱改變，才更新對應的 `classPath`。
3. 儲存後重新啟用原本已啟用的服務；若它原本停用，維持停用。
4. 確認 JAR、服務狀態及 API 呼叫結果。

## 安全與操作限制

- 本系統沒有認證機制；部署前確認管理 API URL 指向使用者指定的環境，不要把測試 JAR 發佈到錯誤環境。
- 只更新使用者明確指定且已在清單中確認的服務；不新增、刪除或批次變更服務，也不自行修改 Mock 回應。
- 更新一旦成功，舊服務會先停用，原 JAR 狀態會被調整。不要宣稱可以回滾；若使用者要求回復，需再次上傳舊 JAR 並更新原服務。
- 最終摘要列出服務類型、`publishUri`、新 JAR 的原始路徑及系統檔名、更新結果、最終啟用狀態和實際驗證結果。不要輸出使用者的敏感資料。
