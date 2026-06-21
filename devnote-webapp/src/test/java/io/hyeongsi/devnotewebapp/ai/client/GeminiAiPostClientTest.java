package io.hyeongsi.devnotewebapp.ai.client;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.genai.errors.ClientException;
import com.google.genai.types.GenerateContentConfig;
import io.hyeongsi.devnotewebapp.ai.dto.AiPostGenerateResponse;
import org.junit.jupiter.api.Test;

import java.time.Duration;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Deque;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class GeminiAiPostClientTest {

    @Test
    void generatesSectionsAsMarkdownAndAssemblesThemInPlanOrder() {
        FakeGateway gateway = new FakeGateway(
                result(planJson(), "STOP"),
                result("Spring Boot 소개 본문", "STOP"),
                result("```yaml\nserver.port: 8080\n```", "STOP"),
                result(successfulReviewJson(), "STOP")
        );
        GeminiAiPostClient client = client(gateway);

        AiPostGenerateResponse response = client.generate(context());

        assertThat(response.title()).isEqualTo("Spring Boot 운영 설정");
        assertThat(response.tags()).containsExactly("Spring Boot", "운영");
        assertThat(response.content()).isEqualTo("""
                ## Spring Boot 소개

                Spring Boot 소개 본문

                ## 운영 환경 적용

                ```yaml
                server.port: 8080
                ```""");
        assertThat(gateway.prompts).hasSize(4);
        assertThat(gateway.prompts.get(1)).startsWith("SECTION_GENERATION").contains("sectionKey: introduction");
        assertThat(gateway.prompts.get(2)).startsWith("SECTION_GENERATION").contains("sectionKey: ops-deployment");
    }

    @Test
    void regeneratesOnlyTheSectionRejectedByReview() {
        FakeGateway gateway = new FakeGateway(
                result(planJson(), "STOP"),
                result("변경되지 않을 소개", "STOP"),
                result("깨진 운영 예제", "STOP"),
                result(failedReviewJson("ops-deployment"), "STOP"),
                result("완성된 운영 예제", "STOP"),
                result(successfulReviewJson(), "STOP")
        );

        AiPostGenerateResponse response = client(gateway).generate(context());

        assertThat(response.content())
                .contains("변경되지 않을 소개")
                .contains("완성된 운영 예제")
                .doesNotContain("깨진 운영 예제");
        assertThat(gateway.sectionPrompts("introduction")).hasSize(1);
        assertThat(gateway.sectionPrompts("ops-deployment")).hasSize(2);
        assertThat(gateway.sectionPrompts("ops-deployment").get(1))
                .startsWith("SECTION_REPAIR")
                .contains("BROKEN_CODE_BLOCK")
                .contains("코드 블록을 완결");
    }

    @Test
    void retriesOnlyOnceWhenASectionReachesMaxTokens() {
        FakeGateway gateway = new FakeGateway(
                result(planJson(), "STOP"),
                result("잘린 소개", "MAX_TOKENS"),
                result("완결된 소개", "STOP"),
                result("운영 본문", "STOP"),
                result(successfulReviewJson(), "STOP")
        );

        AiPostGenerateResponse response = client(gateway).generate(context());

        assertThat(response.content()).contains("완결된 소개").doesNotContain("잘린 소개");
        assertThat(gateway.sectionPrompts("introduction")).hasSize(2);
        assertThat(gateway.sectionPrompts("introduction").get(1)).startsWith("SECTION_RETRY_AFTER_MAX_TOKENS");
    }

    @Test
    void retriesRateLimitedRequestsWithBoundedBackoff() {
        List<Duration> delays = new ArrayList<>();
        FakeGateway gateway = new FakeGateway(
                new ClientException(429, "RESOURCE_EXHAUSTED", "rate limited"),
                result(planJson(), "STOP"),
                result("소개", "STOP"),
                result("운영", "STOP"),
                result(successfulReviewJson(), "STOP")
        );
        GeminiAiPostClient client = new GeminiAiPostClient(gateway, new ObjectMapper(), 16_384, delays::add);

        AiPostGenerateResponse response = client.generate(context());

        assertThat(response.title()).isEqualTo("Spring Boot 운영 설정");
        assertThat(delays).containsExactly(Duration.ofSeconds(5));
    }

    @Test
    void stopsPublishingWhenSecondReviewStillFails() {
        FakeGateway gateway = new FakeGateway(
                result(planJson(), "STOP"),
                result("소개", "STOP"),
                result("깨진 운영", "STOP"),
                result(failedReviewJson("ops-deployment"), "STOP"),
                result("수정한 운영", "STOP"),
                result(failedReviewJson("ops-deployment"), "STOP")
        );

        assertThatThrownBy(() -> client(gateway).generate(context()))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("review failed after repair")
                .hasMessageContaining("ops-deployment");
    }

    private GeminiAiPostClient client(FakeGateway gateway) {
        return new GeminiAiPostClient(gateway, new ObjectMapper(), 16_384, duration -> { });
    }

    private AiPostGenerationContext context() {
        return new AiPostGenerationContext(
                "Spring Boot 운영 설정",
                "실무 중심",
                List.of("환경변수"),
                List.of(),
                "초급",
                "자세히",
                "spring-boot",
                List.of()
        );
    }

    private String planJson() {
        return """
                {
                  "title": "Spring Boot 운영 설정",
                  "summary": "환경별 설정 방법을 설명합니다.",
                  "tags": ["Spring Boot", "운영"],
                  "readTime": "10분 읽기",
                  "recommendedTopics": ["Spring Profiles"],
                  "recommendedCategorySlug": "spring-boot",
                  "thumbnailStyle": "code",
                  "sections": [
                    {"key": "introduction", "heading": "Spring Boot 소개", "brief": "주제와 필요성"},
                    {"key": "ops-deployment", "heading": "운영 환경 적용", "brief": "설정과 예제"}
                  ]
                }
                """;
    }

    private String successfulReviewJson() {
        return """
                {"passed": true, "issues": []}
                """;
    }

    private String failedReviewJson(String sectionKey) {
        return """
                {
                  "passed": false,
                  "issues": [
                    {
                      "sectionKey": "%s",
                      "type": "BROKEN_CODE_BLOCK",
                      "severity": "ERROR",
                      "instruction": "코드 블록을 완결"
                    }
                  ]
                }
                """.formatted(sectionKey);
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
            if (result instanceof RuntimeException exception) {
                throw exception;
            }
            return (GeminiModelResult) result;
        }

        private List<String> sectionPrompts(String sectionKey) {
            return prompts.stream()
                    .filter(prompt -> (prompt.startsWith("SECTION_GENERATION")
                            || prompt.startsWith("SECTION_REPAIR")
                            || prompt.startsWith("SECTION_RETRY_AFTER_MAX_TOKENS"))
                            && prompt.contains("sectionKey: " + sectionKey))
                    .toList();
        }
    }
}
