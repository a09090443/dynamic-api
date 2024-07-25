SELECT mr.RESPONSE_CONTENT AS content
FROM MOCK_RESPONSE mr
WHERE 1 = 1
  AND mr.PUBLISH_URI = :publishUri
  AND mr.METHOD = :method
  AND mr.CONDITION = :condition
  AND mr.SERVICE_TYPE = :serviceType
  AND mr.IS_ACTIVE = TRUE
