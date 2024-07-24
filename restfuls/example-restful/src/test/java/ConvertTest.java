import com.example.dto.ExampleDTO;
import com.example.dto.ExampleResponseDTO;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

class ConvertTest {
    @Test
    void convertRequestToJson() throws JsonProcessingException {
        ExampleDTO exampleDTO = new ExampleDTO();
        exampleDTO.setName("Gary");
        exampleDTO.setAddress("Test Address");
        exampleDTO.setPhone("123456789");
        exampleDTO.setEmail("Gary@test.com.tw");

        ObjectMapper objectMapper = new ObjectMapper();
        String json = objectMapper.writeValueAsString(exampleDTO);
        System.out.println(json);
    }

    @Test
    void convertJsonToResponse() throws JsonProcessingException {
        String json = """
                {
                    "name": "Tom",
                    "address": "Tom's Address",
                    "phone": "987654321",
                    "email": "Tom@test.com.tw"
                }
                """;

        ObjectMapper objectMapper = new ObjectMapper();
        ExampleResponseDTO exampleResponseDTO = objectMapper.readValue(json, ExampleResponseDTO.class);
        System.out.println(exampleResponseDTO);
    }
}
