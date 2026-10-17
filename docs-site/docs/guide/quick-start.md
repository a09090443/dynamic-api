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
    public CompanyResponseDTO getResponseData(@RequestBody CompanyDTO exampleDTO) throws JsonProcessingException {
        ObjectMapper objectMapper = new ObjectMapper();
        String jsonString = objectMapper.writeValueAsString(exampleDTO);
        log.info("request json:{}", jsonString);
        String responseContent = findByPrimaryKey("company", "getResponseData", jsonString, String.class);
        return objectMapper.readValue(responseContent, CompanyResponseDTO.class);
    }
}
```

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

1. 開啟 `http://localhost:8080/dynamic-api/`，進入 **RESTful** 頁面，按 **新增**。
2. 填寫：

   | 欄位 | 值 |
   |---|---|
   | 發布名稱 (Publish URI) | `company` |
   | Class 路徑 | `com.company.controller.CompanyController` |
   | JAR 檔案 | 選擇 `company-restful-1.0-plain.jar` |

3. 儲存。系統會先上傳 JAR，再建立 RESTful 設定（此時為停用）。
4. 在清單中把這一列的 **啟用開關** 打開，確認對話框選「確定」。

## 步驟 3：新增 Mock 回應

1. 在 `company` 這一列按 **回應清單** 圖示，進入 Response 頁面（會自動帶入 `publishUri=company`、`serviceType=RESTFUL`）。
2. 按 **新增**，填寫：

   | 欄位 | 值 |
   |---|---|
   | 呼叫方法名稱 | `getResponseData` |
   | Response 條件 | `{"name":"Acme","address":null,"phone":null,"email":null,"website":null,"description":null}` |
   | 回應內容 | `{"name":"Acme","address":"台北市信義區","phone":"02-1234-5678","email":"contact@acme.example","website":"https://acme.example","description":"Mock 公司資料"}` |

3. 儲存後，把這筆回應的 **啟用開關** 打開（新回應預設停用）。

:::tip 條件字串要一字不差
`ObjectMapper` 會把沒給值的欄位輸出成 `null`，欄位順序依類別宣告順序。最保險的做法是先呼叫一次 API，從後端日誌的 `request json:` 那一行複製實際字串貼進條件。詳見 [Condition 設計指南](../jar-dev/condition-design.md)。
:::

## 步驟 4：呼叫 API

```bash
curl -X POST http://localhost:8080/dynamic-api/company/data \
  -H "Content-Type: application/json" \
  -d '{"name":"Acme"}'
```

預期回應（`@ResponseResultBody` 會把結果包成統一格式）：

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

換一個 `name` 再呼叫，因為條件對不到，會得到 HTTP 500——這是範例程式在查無回應時把空字串交給 `readValue` 造成的，處理方式見 [疑難排解](./troubleshooting.md#呼叫服務得到-500)。

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
| 回應內容 | 完整的 SOAP Envelope XML（範例見 `postman/Endpoints.postman_collection.json` 的 `Company_add_response`） |

專案根目錄的 `postman/Endpoints.postman_collection.json` 收錄了上傳、註冊、啟用、新增回應、呼叫服務的完整請求，可匯入 Postman 直接照順序執行。
