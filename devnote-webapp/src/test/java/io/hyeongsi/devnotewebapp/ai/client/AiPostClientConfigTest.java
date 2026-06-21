package io.hyeongsi.devnotewebapp.ai.client;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class AiPostClientConfigTest {

    @Test
    void passesConfiguredOutputTokenLimitToGeminiClient() {
        AiPostClient client = new AiPostClientConfig().aiPostClient("api-key", "gemini-2.5-flash", 24_576);

        assertThat(client)
                .isInstanceOf(GeminiAiPostClient.class)
                .extracting("maxOutputTokens")
                .isEqualTo(24_576);
    }
}
