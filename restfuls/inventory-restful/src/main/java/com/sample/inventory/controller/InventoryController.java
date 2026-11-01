package com.sample.inventory.controller;

import com.dynamicapi.jarbase.RestfulBase;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.sample.inventory.dto.CreateItemRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 庫存查詢範例。Mock 回應內容原樣回傳（不加 @ResponseResultBody），模擬第三方 API 的原始格式。
 */
@RestController
@RequestMapping("/inventory")   // 後端以 value()[0] 讀取，第一段必須等於 Publish URI
public class InventoryController extends RestfulBase {

    private static final String PUBLISH_URI = "inventory";
    private final ObjectMapper objectMapper = new ObjectMapper();

    @GetMapping("/items/{itemId}")
    public ResponseEntity<String> getItem(@PathVariable String itemId) throws JsonProcessingException {
        return mockOrNotFound("getItem", itemId);
    }

    @PostMapping("/items")
    public ResponseEntity<String> createItem(@RequestBody CreateItemRequest request) throws JsonProcessingException {
        String sku = request == null ? null : request.getSku();
        if (sku == null || sku.isBlank()) {
            ObjectNode error = objectMapper.createObjectNode();
            error.put("error", "SKU_REQUIRED");
            return json(HttpStatus.BAD_REQUEST, objectMapper.writeValueAsString(error));
        }
        return mockOrNotFound("createItem", sku);
    }

    private ResponseEntity<String> mockOrNotFound(String method, String condition) throws JsonProcessingException {
        String content = findByPrimaryKey(PUBLISH_URI, method, condition, String.class);
        // 查無資料時回傳 ""，無法建立實例時回傳 null，兩者都要先判斷
        if (content == null || content.isBlank()) {
            ObjectNode error = objectMapper.createObjectNode();
            error.put("error", "MOCK_RESPONSE_NOT_FOUND");
            error.put("publishUri", PUBLISH_URI);
            error.put("method", method);
            error.put("condition", condition);
            return json(HttpStatus.NOT_FOUND, objectMapper.writeValueAsString(error));
        }
        return json(HttpStatus.OK, content);
    }

    // 捷徑註解的 produces 會被後端忽略，Content-Type 直接寫在回應上
    private ResponseEntity<String> json(HttpStatus status, String body) {
        return ResponseEntity.status(status).contentType(MediaType.APPLICATION_JSON).body(body);
    }
}
