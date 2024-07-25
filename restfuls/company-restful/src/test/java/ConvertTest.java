import com.company.dto.CompanyDTO;
import com.company.dto.CompanyResponseDTO;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

class ConvertTest {
    @Test
    void convertRequestToJson() throws JsonProcessingException {
        CompanyDTO companyDTO = new CompanyDTO();
        companyDTO.setName("Gary");
        companyDTO.setAddress("Test Address");
        companyDTO.setPhone("123456789");
        companyDTO.setEmail("Gary@test.com.tw");
        companyDTO.setWebsite("www.test.com.tw");

        ObjectMapper objectMapper = new ObjectMapper();
        String json = objectMapper.writeValueAsString(companyDTO);
        System.out.println(json);
    }

    @Test
    void convertJsonToResponse() throws JsonProcessingException {
        String json = """
{
  "name": "Gary",
  "address": "Test Address",
  "phone": "123456789",
  "email": "Gary@test.com.tw",
  "website": "www.test.com.tw",
  "description": "測試假回應"
}
                """;

        ObjectMapper objectMapper = new ObjectMapper();
        CompanyResponseDTO companyResponseDTO = objectMapper.readValue(json, CompanyResponseDTO.class);
        System.out.println(companyResponseDTO);
    }
}
