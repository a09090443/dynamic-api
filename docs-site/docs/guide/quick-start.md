---
id: quick-start
title: 快速上手：部署第一個 Mock API
description: '以 restfuls/company-restful 範例走完建置 JAR、建立 RESTful、新增 Mock 回應到呼叫 API 的完整流程。'
sidebar_label: 快速上手
---

# 快速上手：部署第一個 Mock API

本頁用專案內附的 `restfuls/company-restful` 範例，從建置 JAR 到成功呼叫 API 走過一次完整流程，約需 10 分鐘。開始前請先依 [安裝與啟動](./installation.md) 把後端跑起來。

## 範例 JAR 做了什麼

`CompanyController` 對外提供 `POST /company/data`，收到請求後把請求物件轉成 JSON 字串當作 `condition`，查出 Mock 回應：

```java title="restfuls/company-restful/.../CompanyController.java"
@RestController
@ResponseResultBody
@RequestMapping(value = "/company", produces = MediaType.APPLICATION_JSON_VALUE)
public class CompanyController extends RestfulBase {

    @PostMapping("/data")
    public ResponseEntity<Object> getResponseData(@RequestBody CompanyDTO exampleDTO) throws JsonProcessingException {
        ObjectMapper objectMapper = new ObjectMapper();
        String jsonString = objectMapper.writeValueAsString(exampleDTO);
        log.info("request json:{}", jsonString);
        String responseContent = findByPrimaryKey("company", "getResponseData", jsonString, String.class);
        if (responseContent == null || responseContent.isBlank()) {
            // 查無 Mock：回 HTTP 404 與錯誤資料（error、publishUri、method、condition）
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Result.failure(NotFoundStatus.MOCK_RESPONSE_NOT_FOUND, error));
        }
        // @ResponseResultBody 不會包裝 ResponseEntity 內的本文，成功分支也要自行包成 Result
        return ResponseEntity.ok(Result.success(objectMapper.readValue(responseContent, CompanyResponseDTO.class)));
    }
}
```

（上面省略了 `error` Map 的建立與 `NotFoundStatus` 列舉，完整程式見範例檔。）

所以這個服務的 Mock 鍵是：`publishUri = company`、`method = getResponseData`、`condition = 請求 JSON`。

## 步驟 1：建置 JAR

範例模組透過 Gradle toolchain 指定 **JDK 17**，電腦上需要裝有 JDK 17（較新的 JDK 不會被自動採用）。

```powershell
cd restfuls\company-restful
.\gradlew.bat jar
```

產物：`build\libs\company-restful-1.0-plain.jar`

:::warning 請上傳 `-plain.jar`
模組套用了 Spring Boot Gradle Plugin，`build` 任務還會執行 `bootJar` 產生可執行的 fat JAR（類別放在 `BOOT-INF/classes/` 底下，系統載入不到），而且範例沒有 `main` 類別，`bootJar` 本身也可能失敗。請一律使用 `jar` 任務產生的 `-plain.jar`。
:::

## 步驟 2：在管理介面建立 RESTful

1. 開啟 `http://localhost:8080/dynamic-api/`，從左側側欄進入 **RESTful API** 頁面，按 **新增 Restful**。
2. 填寫：

   | 欄位 | 值 |
   |---|---|
   | 發布名稱 (Publish URI) | `company` |
   | Class 路徑 | `com.company.controller.CompanyController` |
   | JAR 檔案 | 選擇 `company-restful-1.0-plain.jar` |

3. 儲存。系統會先上傳 JAR，再建立 RESTful 設定（此時為停用）。
4. 在清單中把這一列的 **啟用開關** 打開，確認框選「啟用」。

## 步驟 3：新增 Mock 回應

1. 在 `company` 這一列按 **回應清單 ›**，進入 Mock 回應頁面（會自動帶入 `publishUri=company`、`serviceType=RESTFUL`）。
2. 按 **新增回應**，在右側編輯面板填寫：

   | 欄位 | 值 |
   |---|---|
   | 方法名稱 | `getResponseData` |
   | 條件 | `{"name":"Acme","address":null,"phone":null,"email":null,"website":null,"description":null}` |
   | 回應內容 | `{"name":"Acme","address":"台北市信義區","phone":"02-1234-5678","email":"contact@acme.example","website":"https://acme.example","description":"Mock 公司資料"}` |

3. 儲存後，把這筆回應的 **啟用開關** 打開並在確認框選「啟用」（新回應預設停用）。

:::tip 條件字串要一字不差
`ObjectMapper` 會把沒給值的欄位輸出成 `null`，欄位順序依類別宣告順序。最保險的做法是先呼叫一次 API，從後端日誌的 `request json:` 那一行複製實際字串貼進條件。詳見 [Condition 設計指南](../jar-dev/condition-design.md)。
:::

## 步驟 4：呼叫 API

```bash
curl -X POST http://localhost:8080/dynamic-api/company/data \
  -H "Content-Type: application/json" \
  -d '{"name":"Acme"}'
```

預期回應（範例以 `Result.success(...)` 把結果包成統一格式）：

```json
{
  "code": 200,
  "message": "OK",
  "data": {
    "name": "Acme",
    "address": "台北市信義區",
    "phone": "02-1234-5678",
    "email": "contact@acme.example",
    "website": "https://acme.example",
    "description": "Mock 公司資料"
  }
}
```

換一個 `name` 再呼叫（例如 `{"name":"NoSuch"}`），因為條件對不到，會得到 **HTTP 404**，本文標出查詢時使用的鍵，方便比對：

```json
{
  "code": 404,
  "message": "Mock response not found",
  "data": {
    "error": "MOCK_RESPONSE_NOT_FOUND",
    "publishUri": "company",
    "method": "getResponseData",
    "condition": "{\"name\":\"NoSuch\",\"address\":null,\"phone\":null,\"email\":null,\"website\":null,\"description\":null}"
  }
}
```

排查方式見 [疑難排解](./troubleshooting.md#呼叫服務得到-404)。

## 進一步：試試 SOAP 範例

`endpoints/company-endpoint` 是對應的 SOAP 範例，流程相同，差異如下：

| 項目 | 值 |
|---|---|
| 建置 | `cd endpoints\company-endpoint` → `.\gradlew.bat jar` → `build\libs\company-endpoint-0.0.1-plain.jar` |
| 建立位置 | **Endpoint** 頁面 |
| Publish URI | `company` |
| Bean 名稱 | `companyWebServiceImpl` |
| Class 路徑 | `com.company.webservice.impl.CompanyWebServiceImpl` |
| WSDL | `http://localhost:8080/dynamic-api/webservice/company?wsdl` |
| method | `getCompany` |
| condition 範例 | `{"employees":null,"name":"Company","taxId":"224567"}` |
| 回應內容 | 完整的 SOAP Envelope XML（範例見 `postman/Endpoints.postman_collection.json` 中 `Management_API` 的 `Common_saveMockResponse_endpoint`） |

專案根目錄的 `postman/Endpoints.postman_collection.json` 收錄了上傳、註冊、啟用、新增回應、呼叫服務的請求，匯入 Postman 後：

- RESTful：先用 `Upload_jar_file` 上傳 JAR（匯入後要在 Body 的 `file` 欄位重新選擇本機 JAR 檔），再依序執行 `Management_API` 的 `Restful_saveController`、`Restful_switchController`、`Common_saveMockResponse_restful`、`Common_switchResponse`，最後執行 `company-restful` 的 `CompanyRestful_getResponseData`。
- SOAP：`Upload_jar_file` → `Company_register` → `Company_switch` → `Common_saveMockResponse_endpoint` → `Common_switchResponse` → `Company_getCompany`。
- 帶 `REPLACE_WITH_*` 的欄位要換成前一步回傳的 id；`Company_add_response`、`Company_get_responses` 沒有帶 `serviceType`，不要用來新增或查詢回應。各資料夾說明見 [管理 API 慣例](../sdd/api/conventions.md#範例集合)。
