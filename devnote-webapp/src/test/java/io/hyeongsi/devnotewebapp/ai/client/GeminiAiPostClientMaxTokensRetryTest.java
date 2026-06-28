package io.hyeongsi.devnotewebapp.ai.client;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.genai.types.GenerateContentConfig;
import io.hyeongsi.devnotewebapp.ai.dto.AiPostGenerateResponse;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Deque;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class GeminiAiPostClientMaxTokensRetryTest {

    @Test
    void retriesWithMaxTokenPromptBeforeSplittingAUnit() {
        FakeGateway gateway = new FakeGateway(
                result(planWithTwoUnitsJson(), "STOP"),
                result("env body", "STOP"),
                result("truncated systemd body", "MAX_TOKENS"),
                result("short retried systemd body", "STOP"),
                result(successfulReviewJson(), "STOP")
        );

        AiPostGenerateResponse response = client(gateway).generate(context());

        assertThat(response.content())
                .contains("env body")
                .contains("short retried systemd body")
                .doesNotContain("truncated systemd body");
        assertThat(gateway.promptsFor("ops/systemd")).hasSize(2);
        assertThat(gateway.promptsFor("ops/systemd").get(1))
                .startsWith("SECTION_RETRY_AFTER_MAX_TOKENS")
                .contains("contentKey: ops/systemd");
        assertThat(gateway.prompts.stream()
                .filter(prompt -> prompt.startsWith("UNIT_SPLIT_PLAN"))
                .filter(prompt -> prompt.contains("contentKey: ops/systemd")))
                .isEmpty();
    }

    @Test
    void sectionGenerationPromptRequestsPracticalNormalLength() {
        FakeGateway gateway = new FakeGateway(
                result(planWithTwoUnitsJson(), "STOP"),
                result("env body", "STOP"),
                result("systemd body", "STOP"),
                result(successfulReviewJson(), "STOP")
        );

        client(gateway).generate(context());

        assertThat(gateway.prompts.get(1))
                .contains("practical normal length")
                .contains("unnecessary verbosity")
                .contains("MAX_TOKENS");
    }

    private GeminiAiPostClient client(FakeGateway gateway) {
        return new GeminiAiPostClient(
                gateway,
                new ObjectMapper(),
                16_384,
                2,
                40,
                3,
                2,
                false,
                duration -> { },
                new GeminiRequestRateLimiter(new AdvancingClock())
        );
    }

    private AiPostGenerationContext context() {
        return new AiPostGenerationContext(
                "Spring Boot operations",
                "practical guide",
                List.of("env"),
                List.of(),
                "beginner",
                "normal",
                "spring-boot",
                List.of()
        );
    }

    private String planWithTwoUnitsJson() {
        return """
                {
                  "title": "Spring Boot operations",
                  "summary": "Explains operational setup.",
                  "tags": ["Spring Boot", "operations"],
                  "readTime": "10 min read",
                  "recommendedTopics": ["Spring Profiles"],
                  "recommendedCategorySlug": "spring-boot",
                  "thumbnailStyle": "code",
                  "sections": [
                    {
                      "key": "ops",
                      "heading": "Operational setup",
                      "brief": "Production-ready setup",
                      "units": [
                        {"key": "env", "heading": "Environment variables", "brief": "How to wire environment variables"},
                        {"key": "systemd", "heading": "systemd service", "brief": "How to manage the service with systemd"}
                      ]
                    }
                  ]
                }
                """;
    }

    private String successfulReviewJson() {
        return """
                {"passed": true, "issues": []}
                """;
    }

    private GeminiModelResult result(String text, String finishReason) {
        return new GeminiModelResult(text, finishReason);
    }

    private static final class FakeGateway implements GeminiModelGateway {
        private final Deque<Object> results;
        private final List<String> prompts = new ArrayList<>();

        private FakeGateway(Object... results) {
            this.results = new ArrayDeque<>(List.of(results));
        }

        @Override
        public GeminiModelResult generate(String prompt, GenerateContentConfig config) {
            prompts.add(prompt);
            Object result = results.removeFirst();
            return (GeminiModelResult) result;
        }

        private List<String> promptsFor(String contentKey) {
            return prompts.stream()
                    .filter(prompt -> prompt.contains("contentKey: " + contentKey))
                    .toList();
        }
    }

    private static final class AdvancingClock extends Clock {
        private Instant instant = Instant.parse("2026-06-22T00:00:00Z");

        @Override
        public ZoneId getZone() {
            return ZoneOffset.UTC;
        }

        @Override
        public Clock withZone(ZoneId zone) {
            return this;
        }

        @Override
        public Instant instant() {
            Instant current = instant;
            instant = instant.plus(Duration.ofSeconds(60));
            return current;
        }
    }
}
