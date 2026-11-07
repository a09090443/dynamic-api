# mitake-restful

RESTful JAR 範例：依《三竹簡訊 API 文件 v2.14》（B2C_MitakeAPI_v2.14）模擬三竹簡訊的單筆發送、多筆發送、狀態／餘額查詢與預約取消。路徑沿用原規格 `/b2c/mtk/...`，Mock 回應內容以三竹的純文字格式原樣回傳。

| 項目 | 值 |
|---|---|
| Publish URI | `b2c` |
| Controller 類別路徑 | `com.sample.mitake.controller.MitakeController` |
| 呼叫網址前綴 | `http://localhost:8080/dynamic-api/b2c/mtk` |
| 回應 Content-Type | `text/plain;charset=UTF-8` |

既有程式要改呼叫本服務時，把三竹的網域（含協定）換成 `http://<host>:8080/dynamic-api`，後面的 `/b2c/mtk/...` 不變。

## 路由與 Mock 比對鍵

四個操作都只接受 **POST**。參數可以放在查詢字串，也可以用 `application/x-www-form-urlencoded` 放在本文；所有參數都不是 Spring 必填，缺少時由程式自行判斷。

| 路由 | 操作 | method | condition |
|---|---|---|---|
| `POST /b2c/mtk/SmSend` | 單筆發送 | `SmSend` | 正規化後的 `dstaddr`（規則見下方） |
| `POST /b2c/mtk/SmBulkSend` | 多筆發送 | `SmBulkSend` | 查詢參數 `objectID` 去除前後空白 |
| `POST /b2c/mtk/SmQuery`（有 `msgid`） | 簡訊狀態查詢 | `SmQuery` | `msgid` 移除所有空白，多筆以半形逗號分隔、順序保留，例如 `0311216947, 0311216948, 0311216949` → `0311216947,0311216948,0311216949` |
| `POST /b2c/mtk/SmQuery`（沒有 `msgid` 或空白） | 帳號餘額查詢 | `SmQueryBalance` | `username` 去除前後空白 |
| `POST /b2c/mtk/SmCancel` | 預約簡訊取消 | `SmCancel` | `msgid` 移除所有空白（規則同 SmQuery） |

`dstaddr` 正規化（依文件 v2.14 的門號規則），依序：

1. 移除開頭的 `+`。
2. 移除所有 `.`、`-` 與空格。
3. 開頭為 `88609` 時轉成 `8869`。

| 輸入 | condition |
|---|---|
| `+886-09 12.345.678` | `886912345678` |
| `0912-345 678` | `0912345678` |
| `0912345678` | `0912345678` |

`dstaddr` 或 `objectID` 缺少時，以空字串查詢，通常會得到下方的 404。

## 回應

| 情況 | HTTP 狀態 | 回應內容（text/plain） |
|---|---|---|
| `username` 缺少或空白（不查 Mock） | 200 | `statuscode=c` |
| `password` 缺少或空白（不查 Mock） | 200 | `statuscode=d` |
| 命中啟用中的 Mock 回應 | 200 | Mock 回應內容原文 |
| 查不到啟用中的 Mock 回應，或內容為空白 | 404 | `MOCK_RESPONSE_NOT_FOUND`，以及 `publishUri=b2c`、`method=<method>`、`condition=<condition>` 各一行 |

`statuscode=c`／`d` 依文件附錄二（帳號、密碼未輸入）。先檢查帳號再檢查密碼，兩者都有值才查 Mock。

## 可直接建立的 Mock 回應

服務類型選 RESTful，Publish URI 填 `b2c`。回應內容取自文件的 Response 範例，換行照原樣輸入。

| 操作 | Method | Condition | 回應內容 |
|---|---|---|---|
| 單筆發送 | `SmSend` | `0912345678` | `[1]`<br/>`msgid=#000000013`<br/>`statuscode=1`<br/>`AccountPoint=126` |
| 多筆發送 | `SmBulkSend` | `batch001` | `[1]`<br/>`msgid=#000000333`<br/>`statuscode=0`<br/>`[2]`<br/>`msgid=#000000334`<br/>`statuscode=1`<br/>`AccountPoint=92` |
| 狀態查詢 | `SmQuery` | `0311216947,0311216948,0311216949` | `0311216947`（Tab）`6`（Tab）`20060623103807`<br/>`0311216948`（Tab）`4`（Tab）`20060623103810`<br/>`0311216949`（Tab）`4`（Tab）`20060623103809` |
| 餘額查詢 | `SmQueryBalance` | `testuser` | `AccountPoint=110` |
| 預約取消 | `SmCancel` | `0311216947,0311216948,0311216949` | `0311216947=9`<br/>`0311216948=?`<br/>`0311216949=5` |

各回應範例出處：單筆發送為文件第 6 頁、多筆發送為第 8 頁、狀態查詢為第 10 頁、餘額查詢為第 11 頁、預約取消為第 12 頁。狀態查詢每行為 `msgid`、`statuscode`、`statustime` 以 Tab 分隔，換行為 CRLF；取消回應每行為「簡訊序號=簡訊狀態」，換行為 CRLF。實際狀態碼的意義見原文件。Condition 的 `batch001`、`testuser` 是本範例自訂的呼叫參數，不是文件內容。

## 建置

本範例不附 Gradle Wrapper，使用系統安裝的 Gradle（機器上需要 JDK 17）：

```bash
gradle jar
```

上傳 `build/libs/mitake-restful-1.0-plain.jar`。不要用 `gradle build` 產生的 boot JAR，它的類別位於 `BOOT-INF/classes/`，系統無法載入。

## 呼叫方法

呼叫成功的前提：

1. 在管理介面上傳 `mitake-restful-1.0-plain.jar`。
2. 建立 RESTful：Publish URI 填 `b2c`，Class 路徑填 `com.sample.mitake.controller.MitakeController`，並手動啟用（新建或編輯後預設為停用）。
3. 依上表建立 Mock 回應，並手動啟用（新建或編輯後預設為停用）。

以下範例的帳號為 `testuser`、密碼為 `testpass`；本服務不驗證帳密內容，只檢查是否有值。

### SmSend：單筆發送

- `POST http://localhost:8080/dynamic-api/b2c/mtk/SmSend`
- Header：`Content-Type: application/x-www-form-urlencoded`
- 參數：`username=testuser`、`password=testpass`、`dstaddr=0912345678`、`smbody=測試簡訊`（`smbody`、`destname`、`dlvtime`、`vldtime`、`response`、`clientid`、`CharsetURL` 可照原規格帶入，不影響比對）
- 比對：method `SmSend`、condition `0912345678`

```bash
curl -X POST 'http://localhost:8080/dynamic-api/b2c/mtk/SmSend?CharsetURL=UTF-8' \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  --data-urlencode 'username=testuser' \
  --data-urlencode 'password=testpass' \
  --data-urlencode 'dstaddr=0912345678' \
  --data-urlencode 'smbody=測試簡訊'
```

### SmBulkSend：多筆發送

- `POST http://localhost:8080/dynamic-api/b2c/mtk/SmBulkSend?username=testuser&password=testpass&objectID=batch001&Encoding_PostIn=UTF-8`
- Header：`Content-Type: text/plain`
- 本文：每行一筆，格式為 `ClientID$$dstaddr$$dlvtime$$vldtime$$destname$$response$$smbody`（7 欄，本文不參與比對）。以下兩筆取自文件第 7 頁：
  - `1$$0999999999$$20170101000000$$20180101000000$$大寶$$$$我是長簡訊我是長簡訊`
  - `2$$0900000000$$$$$$二寶$$$$我是長簡訊我是長簡訊`
- 比對：method `SmBulkSend`、condition `batch001`

```bash
curl -X POST 'http://localhost:8080/dynamic-api/b2c/mtk/SmBulkSend?username=testuser&password=testpass&objectID=batch001&Encoding_PostIn=UTF-8' \
  -H 'Content-Type: text/plain' \
  --data-binary $'1$$0999999999$$20170101000000$$20180101000000$$大寶$$$$我是長簡訊我是長簡訊\n2$$0900000000$$$$$$二寶$$$$我是長簡訊我是長簡訊'
```

### SmQuery：簡訊狀態查詢

- `POST http://localhost:8080/dynamic-api/b2c/mtk/SmQuery`
- Header：`Content-Type: application/x-www-form-urlencoded`
- 參數：`username=testuser`、`password=testpass`、`msgid=0311216947,0311216948,0311216949`（多筆以半形逗號分隔）
- 比對：method `SmQuery`、condition `0311216947,0311216948,0311216949`

```bash
curl -X POST http://localhost:8080/dynamic-api/b2c/mtk/SmQuery \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d 'username=testuser&password=testpass&msgid=0311216947,0311216948,0311216949'
```

### SmQuery：帳號餘額查詢

- `POST http://localhost:8080/dynamic-api/b2c/mtk/SmQuery`
- Header：`Content-Type: application/x-www-form-urlencoded`
- 參數：`username=testuser`、`password=testpass`（不帶 `msgid`）
- 比對：method `SmQueryBalance`、condition `testuser`

```bash
curl -X POST http://localhost:8080/dynamic-api/b2c/mtk/SmQuery \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d 'username=testuser&password=testpass'
```

### SmCancel：預約簡訊取消

- `POST http://localhost:8080/dynamic-api/b2c/mtk/SmCancel`
- Header：`Content-Type: application/x-www-form-urlencoded`
- 參數：`username=testuser`、`password=testpass`、`msgid=0311216947,0311216948,0311216949`（多筆以半形逗號分隔）
- 比對：method `SmCancel`、condition `0311216947,0311216948,0311216949`

```bash
curl -X POST http://localhost:8080/dynamic-api/b2c/mtk/SmCancel \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d 'username=testuser&password=testpass&msgid=0311216947,0311216948,0311216949'
```

把 condition 換成沒有建立 Mock 的值，會得到 404；拿掉 `username` 或 `password` 會得到 `statuscode=c`／`statuscode=d`。Postman 範例在 `postman/Endpoints.postman_collection.json` 的 `mitake-restful` 資料夾。

## 未實作的規格項目

- **主動狀態回報（Callback）**：這是三竹主動以 GET 呼叫客戶端網址，不是三竹提供給客戶端呼叫的 API；本系統的 JAR 只在被呼叫時查 Mock 回應，不會主動發出請求。
- **需要保留狀態的行為**：`clientid` 12 小時內重複判斷（`Duplicate=Y`）、同時連線數上限、SmBulkSend 與 SmQuery／SmCancel 的筆數上限、扣除點數。Mock 回應是固定比對回傳，需要時請自行建立對應 condition 的 Mock 回應來模擬。
- **實際發送、TLS 與 IP 鎖定**：本系統是 Mock 伺服器，不會發送簡訊，也沒有這些連線限制。

詳細說明見文件網站的 [開發 RESTful JAR](../../docs-site/docs/jar-dev/restful-jar.md)。
