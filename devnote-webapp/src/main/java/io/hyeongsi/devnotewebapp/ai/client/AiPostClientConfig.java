package io.hyeongsi.devnotewebapp.ai.client;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class AiPostClientConfig {

    @Bean
    AiPostClient aiPostClient(
            @Value("${devnote.ai.gemini.api-key:}") String apiKey,
            @Value("${devnote.ai.gemini.model:gemini-2.5-flash}") String model
    ) {
        if (apiKey == null || apiKey.isBlank()) {
            return new MockAiPostClient();
        }
        return new GeminiAiPostClient(apiKey, model, new ObjectMapper());
    }
}
