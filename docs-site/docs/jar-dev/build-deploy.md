---
id: build-deploy
title: 打包、上傳與驗證
description: '自訂 JAR 的打包（-plain.jar）、透過管理介面或 API 上傳並建立服務、啟用後驗證，以及更新 JAR 版本的步驟。'
sidebar_label: 打包、上傳與驗證
---

# 打包、上傳與驗證

## 1. 打包

```powershell
.\gradlew.bat jar
```

取得 `build\libs\{name}-{version}-plain.jar`。

| 檢查項目 | 方法 |
|---|---|
| 類別在 JAR 根目錄（不是 `BOOT-INF/classes/`） | `jar tf build\libs\xxx-plain.jar` |
| 編譯版本為 Java 17 以下 | 後端執行在 JDK 17 以上即可載入 |
| 沒有包含 `com.dynamicapi.*` | 這些類別由後端提供 |

## 2. 上傳與建立

**透過管理介面**：在 Endpoint 或 RESTful 頁面新增時選擇 JAR，系統會先上傳再建立設定。操作見 [管理 Endpoint](../guide/endpoint.md)、[管理 RESTful](../guide/restful.md)。

**透過 API**（適合 CI 或批次建立）：

```bash
# 1) 上傳 JAR，取得 jarFileId
curl -F "file=@build/libs/company-restful-1.0-plain.jar" \
  http://localhost:8080/dynamic-api/common/uploadJarFile
# → {"code":200,"message":"OK","data":{"jarFileId":"<uuid>","jarFileName":"<uuid>.jar"}}

# 2) 建立 RESTful 設定
curl -X POST http://localhost:8080/dynamic-api/api/saveController \
  -H "Content-Type: application/json" \
  -d '{"publishUri":"company","classPath":"com.company.controller.CompanyController","jarFileId":"<uuid>"}'

# 3) 啟用
curl "http://localhost:8080/dynamic-api/api/switchController?publishUri=company&isActive=true"

# 4) 新增 Mock 回應（建立後為停用）
curl -X POST http://localhost:8080/dynamic-api/common/saveMockResponse \
  -H "Content-Type: application/json" \
  -d '{"publishUri":"company","method":"getResponseData","serviceType":"RESTFUL",
       "condition":"{\"name\":\"Acme\",\"address\":null,\"phone\":null,\"email\":null,\"website\":null,\"description\":null}",
       "responseContent":"{\"name\":\"Acme\"}"}'
# → data.id 為回應 ID

# 5) 啟用回應
curl "http://localhost:8080/dynamic-api/common/switchResponse?id=<回應ID>&isActive=true"
```

SOAP 服務改用 `/ws/saveWebService`（多一個 `beanName`、可選 `ignoreCdata`）與 `/ws/switchWebService`。完整規格見 [管理 API](../sdd/api/conventions.md)。

:::note 上傳後的檔名
系統會把 JAR 另存為 `{UUID}.jar`，原始檔名不會保留。要追蹤版本，請把版本號寫在 Publish URI 以外的地方（例如 JAR 的 `MANIFEST.MF` 或你的部署紀錄）。
:::

## 3. 驗證

| 類型 | 驗證方式 |
|---|---|
| SOAP | 開啟 `http://localhost:8080/dynamic-api/webservice/{publishUri}?wsdl`，確認 WSDL 與預期一致；再用 SoapUI / Postman 送出請求 |
| REST | 直接呼叫 `http://localhost:8080/dynamic-api/{publishUri}/...` |

如果呼叫結果不如預期，依 [疑難排解](../guide/troubleshooting.md) 檢查日誌。

## 4. 更新版本

1. 重新打包 JAR。
2. 在管理介面 **編輯** 該服務並選擇新的 JAR（Publish URI 不變）。
3. 儲存後服務會變成停用，重新打開開關。

舊的 JAR 會被標記為未使用（`I`），實體檔案保留在 `jar.file.dir`。Mock 回應不受影響。

:::tip 會不會用到舊類別？
停用時系統會關閉舊的 ClassLoader 並從註冊表移除，重新啟用時會建立新的 ClassLoader 載入新 JAR，因此不需要重啟後端。
:::
