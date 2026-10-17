UPDATE MOCK_RESPONSE
SET PUBLISH_URI = :publishUri, METHOD = :method, CONDITION = :condition, RESPONSE_CONTENT = :responseContent, UPDATED_AT = :updatedAt
WHERE
    ID = :id

