package io.hyeongsi.devnotewebapp.ai.client;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatIllegalArgumentException;

class AiPostClientConfigTest {

    @Test
    void passesConfiguredLimitsToGeminiClient() {
        AiPostClient client = new AiPostClientConfig().aiPostClient(
                "api-key",
                "gemini-2.5-flash",
                24_576,
                3,
                55
        );

        assertThat(client)
                .isInstanceOf(GeminiAiPostClient.class)
                .extracting("maxOutputTokens", "maxSplitDepth", "maxGenerationCalls")
                .containsExactly(24_576, 3, 55);
    }

    @Test
    void rejectsLimitsBelowOne() {
        GeminiModelGateway gateway = (prompt, config) -> new GeminiModelResult("", "STOP");

        assertThatIllegalArgumentException().isThrownBy(() ->
                new GeminiAiPostClient(gateway, new ObjectMapper(), 0, 2, 40, duration -> { }));
        assertThatIllegalArgumentException().isThrownBy(() ->
                new GeminiAiPostClient(gateway, new ObjectMapper(), 16_384, 0, 40, duration -> { }));
        assertThatIllegalArgumentException().isThrownBy(() ->
                new GeminiAiPostClient(gateway, new ObjectMapper(), 16_384, 2, 0, duration -> { }));
    }
}
