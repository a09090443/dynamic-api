package com.sample.mitake.controller;

import com.dynamicapi.jarbase.RestfulBase;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * 三竹簡訊 API（v2.14）Mock 範例。
 * <p>
 * 路徑沿用原規格 {@code /b2c/mtk/...}，Mock 回應內容以 UTF-8 純文字原樣回傳（三竹的 key=value 格式），
 * 不加 @ResponseResultBody。所有參數都是 required=false，缺少帳號／密碼時由程式回 statuscode=c／d，
 * 不會先被 Spring 以 HTTP 400 拒絕。
 */
@RestController
@RequestMapping("/b2c")   // 後端以 value()[0] 讀取，第一段必須等於 Publish URI
public class MitakeController extends RestfulBase {

    private static final String PUBLISH_URI = "b2c";
    // 捷徑註解的 produces 會被後端忽略，Content-Type 直接寫在回應上；預設 ISO-8859-1 會讓中文亂碼
    private static final MediaType TEXT_PLAIN_UTF8 = MediaType.parseMediaType("text/plain;charset=UTF-8");

    /** 單筆發送：condition = 正規化後的 dstaddr。 */
    @PostMapping("/mtk/SmSend")
    public ResponseEntity<String> smSend(@RequestParam(value = "username", required = false) String username,
                                         @RequestParam(value = "password", required = false) String password,
                                         @RequestParam(value = "dstaddr", required = false) String dstaddr) {
        ResponseEntity<String> authError = checkAccount(username, password);
        if (authError != null) {
            return authError;
        }
        return mockOrNotFound("SmSend", normalizeDstaddr(dstaddr));
    }

    /** 多筆發送：condition = 查詢參數 objectID；request body 為多筆簡訊的純文字，Mock 比對不使用。 */
    @PostMapping("/mtk/SmBulkSend")
    public ResponseEntity<String> smBulkSend(@RequestParam(value = "username", required = false) String username,
                                             @RequestParam(value = "password", required = false) String password,
                                             @RequestParam(value = "objectID", required = false) String objectID,
                                             @RequestBody(required = false) String body) {
        ResponseEntity<String> authError = checkAccount(username, password);
        if (authError != null) {
            return authError;
        }
        return mockOrNotFound("SmBulkSend", objectID == null ? "" : objectID.trim());
    }

    /** 狀態查詢：有 msgid 時 method=SmQuery；沒有或空白時視為餘額查詢，method=SmQueryBalance、condition=username。 */
    @PostMapping("/mtk/SmQuery")
    public ResponseEntity<String> smQuery(@RequestParam(value = "username", required = false) String username,
                                          @RequestParam(value = "password", required = false) String password,
                                          @RequestParam(value = "msgid", required = false) String msgid) {
        ResponseEntity<String> authError = checkAccount(username, password);
        if (authError != null) {
            return authError;
        }
        if (msgid == null || msgid.isBlank()) {
            return mockOrNotFound("SmQueryBalance", username.trim());
        }
        return mockOrNotFound("SmQuery", removeWhitespace(msgid));
    }

    /** 預約取消：condition = msgid 移除所有空白（多筆以半形逗號分隔，順序保留）。 */
    @PostMapping("/mtk/SmCancel")
    public ResponseEntity<String> smCancel(@RequestParam(value = "username", required = false) String username,
                                           @RequestParam(value = "password", required = false) String password,
                                           @RequestParam(value = "msgid", required = false) String msgid) {
        ResponseEntity<String> authError = checkAccount(username, password);
        if (authError != null) {
            return authError;
        }
        return mockOrNotFound("SmCancel", removeWhitespace(msgid));
    }

    /** 依文件附錄二：帳號空白回 statuscode=c，密碼空白回 statuscode=d；通過時回 null。 */
    private ResponseEntity<String> checkAccount(String username, String password) {
        if (username == null || username.isBlank()) {
            return text(HttpStatus.OK, "statuscode=c\r\n");
        }
        if (password == null || password.isBlank()) {
            return text(HttpStatus.OK, "statuscode=d\r\n");
        }
        return null;
    }

    private ResponseEntity<String> mockOrNotFound(String method, String condition) {
        String content = findByPrimaryKey(PUBLISH_URI, method, condition, String.class);
        // 查無資料時回傳 ""，無法建立實例時回傳 null，兩者都要先判斷
        if (content == null || content.isBlank()) {
            return text(HttpStatus.NOT_FOUND, "MOCK_RESPONSE_NOT_FOUND\r\n"
                    + "publishUri=" + PUBLISH_URI + "\r\n"
                    + "method=" + method + "\r\n"
                    + "condition=" + condition + "\r\n");
        }
        return text(HttpStatus.OK, content);
    }

    /**
     * dstaddr 正規化（文件 v2.14）：移除開頭的 +，移除所有 .、- 與空格，開頭 88609 轉為 8869。
     * 例：{@code +886-09 12.345.678} → {@code 886912345678}；{@code 0912-345 678} → {@code 0912345678}。
     */
    static String normalizeDstaddr(String dstaddr) {
        if (dstaddr == null) {
            return "";
        }
        String value = dstaddr.trim();
        if (value.startsWith("+")) {
            value = value.substring(1);
        }
        value = value.replace(".", "").replace("-", "").replace(" ", "");
        if (value.startsWith("88609")) {
            value = "8869" + value.substring(5);
        }
        return value;
    }

    private static String removeWhitespace(String value) {
        return value == null ? "" : value.replaceAll("\\s+", "");
    }

    private ResponseEntity<String> text(HttpStatus status, String body) {
        return ResponseEntity.status(status).contentType(TEXT_PLAIN_UTF8).body(body);
    }
}
