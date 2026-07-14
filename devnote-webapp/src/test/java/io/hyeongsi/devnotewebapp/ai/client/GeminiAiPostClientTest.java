package io.hyeongsi.devnotewebapp.ai.client;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.genai.errors.ClientException;
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
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class GeminiAiPostClientTest {

    @Test
    void generatesDirectPostWithOneGeminiRequestWhenSingleRequestIsEnabled() {
        FakeGateway gateway = new FakeGateway(result(directPostJson(), "STOP"));

        AiPostGenerateResponse response = client(gateway).generate(singleRequestContext());

        assertThat(response.title()).isEqualTo("Spring Boot operations");
        assertThat(response.content()).contains("## Checklist");
        assertThat(gateway.prompts).hasSize(1);
        assertThat(gateway.prompts.getFirst()).startsWith("POST_DIRECT");
    }

    @Test
    void generatesChildUnitsInPlanOrderAndAssemblesTheirHeadings() {
        FakeGateway gateway = new FakeGateway(
                result(planWithTwoUnitsJson(), "STOP"),
                result("환경변수 본문", "STOP"),
                result("systemd 본문", "STOP"),
                result(successfulReviewJson(), "STOP")
        );

        AiPostGenerateResponse response = client(gateway).generate(context());

        assertThat(response.content()).isEqualTo("""
                ## 운영 환경 적용

                ### 환경변수 구성

                환경변수 본문

                ### systemd 설정

                systemd 본문""");
        assertThat(gateway.promptsFor("ops/env")).hasSize(1);
        assertThat(gateway.promptsFor("ops/systemd")).hasSize(1);
    }

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
                result(failedReviewJson("ops-deployment/configuration"), "STOP"),
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
    void repairsOnlyTheRejectedLeafAndPreservesItsSibling() {
        FakeGateway gateway = new FakeGateway(
                result(planWithUnaffectedAndTwoUnitSectionJson(), "STOP"),
                result("소개 본문", "STOP"),
                result("기존 환경변수 본문", "STOP"),
                result("보존할 systemd 본문", "STOP"),
                result(failedReviewForContentJson("ops/env"), "STOP"),
                result("수정 환경변수 본문", "STOP"),
                result(successfulReviewJson(), "STOP")
        );

        AiPostGenerateResponse response = client(gateway).generate(context());

        assertThat(response.content())
                .contains("수정 환경변수 본문")
                .contains("보존할 systemd 본문")
                .doesNotContain("기존 환경변수 본문");
        assertThat(gateway.promptsFor("ops/env")).hasSize(2);
        assertThat(gateway.promptsFor("ops/systemd")).hasSize(1);
    }

    @Test
    void splitsOnlyTheRejectedLeafWhenItsRepairReachesMaxTokens() {
        FakeGateway gateway = new FakeGateway(
                result(planJson(), "STOP"),
                result("보존할 소개", "STOP"),
                result("수정 전 운영", "STOP"),
                result(failedReviewForContentJson("ops-deployment/configuration"), "STOP"),
                result("잘린 수정 본문", "MAX_TOKENS"),
                result(splitPlanJson(), "STOP"),
                result("서비스 파일 수정", "STOP"),
                result("재시작 수정", "STOP"),
                result(successfulReviewJson(), "STOP")
        );

        AiPostGenerateResponse response = client(gateway).generate(context());

        assertThat(response.content())
                .contains("보존할 소개")
                .contains("서비스 파일 수정")
                .contains("재시작 수정")
                .doesNotContain("수정 전 운영")
                .doesNotContain("잘린 수정 본문");
    }

    @Test
    void rejectsInvalidSectionKeys() {
        for (String invalidKey : List.of("ops/env", "ops env", "Ops")) {
            FakeGateway gateway = new FakeGateway(
                    result(planJson().replace("\"key\": \"introduction\"", "\"key\": \"" + invalidKey + "\""), "STOP")
            );

            assertThatThrownBy(() -> client(gateway).generate(context()))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("invalid section key");
        }
    }

    @Test
    void rejectsInvalidUnitKeys() {
        for (String invalidKey : List.of("intro/overview", "intro overview", "Overview")) {
            FakeGateway gateway = new FakeGateway(
                    result(planJson().replace("\"key\": \"overview\"", "\"key\": \"" + invalidKey + "\""), "STOP")
            );

            assertThatThrownBy(() -> client(gateway).generate(context()))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("invalid unit key");
        }
    }

    @Test
    void continuesToRejectDuplicateSectionAndContentKeys() {
        String duplicateSectionPlan = planJson()
                .replace("\"key\": \"ops-deployment\"", "\"key\": \"introduction\"");
        String duplicateContentPlan = planWithTwoUnitsJson()
                .replace("\"key\": \"systemd\"", "\"key\": \"env\"");

        assertThatThrownBy(() -> client(new FakeGateway(result(duplicateSectionPlan, "STOP"))).generate(context()))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("duplicate section keys");
        assertThatThrownBy(() -> client(new FakeGateway(result(duplicateContentPlan, "STOP"))).generate(context()))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("duplicate content keys");
    }

    @Test
    void rejectsGeneratedUnitWithoutMarkdownOrChildren() {
        assertThatThrownBy(() -> new GeminiGeneratedUnit(
                "ops/env", "환경변수 구성", "환경변수 설정", 3, null, List.of()
        ))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("markdown or children");
    }

    @Test
    void splitsOnlyTheUnitThatReachedMaxTokensAndPreservesCompletedSiblings() {
        FakeGateway gateway = new FakeGateway(
                result(planWithTwoUnitsJson(), "STOP"),
                result("보존된 환경변수 본문", "STOP"),
                result("잘린 systemd 본문", "MAX_TOKENS"),
                result(splitPlanJson(), "STOP"),
                result("서비스 파일 본문", "STOP"),
                result("재시작 본문", "STOP"),
                result(successfulReviewJson(), "STOP")
        );

        AiPostGenerateResponse response = client(gateway).generate(context());

        assertThat(response.content())
                .contains("보존된 환경변수 본문")
                .contains("서비스 파일 본문")
                .contains("재시작 본문")
                .doesNotContain("잘린 systemd 본문");
        assertThat(gateway.prompts.stream()
                .filter(prompt -> prompt.startsWith("SECTION_GENERATION"))
                .filter(prompt -> prompt.contains("contentKey: ops/env")))
                .hasSize(1);
        assertThat(gateway.prompts.stream()
                .filter(prompt -> prompt.startsWith("SECTION_RETRY_AFTER_MAX_TOKENS"))
                .filter(prompt -> prompt.contains("contentKey: ops/systemd")))
                .hasSize(1);
        assertThat(gateway.prompts.stream()
                .filter(prompt -> prompt.startsWith("POST_REVIEW")))
                .singleElement()
                .asString()
                .contains("ops/systemd/service-file", "ops/systemd/restart");
    }

    @Test
    void stopsSplittingAtTheConfiguredDepth() {
        FakeGateway gateway = new FakeGateway(
                result(planWithTwoUnitsJson(), "STOP"),
                result("환경변수 본문", "STOP"),
                result("잘린 systemd", "MAX_TOKENS"),
                result(splitPlanJson(), "STOP"),
                result("still too long", "MAX_TOKENS"),
                result("잘린 서비스 파일", "MAX_TOKENS")
        );
        GeminiAiPostClient client = client(gateway, 1, 40);

        assertThatThrownBy(() -> client.generate(context()))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("UNIT_SPLIT_DEPTH")
                .hasMessageContaining("ops/systemd/service-file")
                .hasMessageContaining("depth=1")
                .hasMessageContaining("MAX_TOKENS");
    }

    @Test
    void stopsBeforeExceedingTheGenerationCallBudget() {
        FakeGateway gateway = new FakeGateway(
                result(planWithTwoUnitsJson(), "STOP"),
                result("환경변수 본문", "STOP")
        );
        GeminiAiPostClient client = client(gateway, 2, 1);

        assertThatThrownBy(() -> client.generate(context()))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("generation call limit")
                .hasMessageContaining("ops/systemd");
        assertThat(gateway.prompts).hasSize(2);
    }

    @Test
    void rejectsASplitPlanWithFewerThanTwoChildren() {
        FakeGateway gateway = new FakeGateway(
                result(planWithTwoUnitsJson(), "STOP"),
                result("환경변수 본문", "STOP"),
                result("잘린 systemd", "MAX_TOKENS"),
                result("""
                        {"units":[{"key":"only","heading":"하나", "brief":"하나만 반환"}]}
                        """, "STOP")
        );

        assertThatThrownBy(() -> client(gateway).generate(context()))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("2-5 units")
                .hasMessageContaining("ops/systemd");
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
    void rejectsRequestsBeforeTheGatewayWhenTheMinuteLimitIsExhausted() {
        FakeGateway gateway = new FakeGateway(
                result(planJson(), "STOP"),
                result("소개", "STOP"),
                result("운영", "STOP"),
                result(successfulReviewJson(), "STOP"),
                result(planJson(), "STOP")
        );
        GeminiRequestRateLimiter limiter = new GeminiRequestRateLimiter(Clock.fixed(
                Instant.parse("2026-06-22T00:00:00Z"),
                ZoneOffset.UTC
        ));
        GeminiAiPostClient client = new GeminiAiPostClient(
                gateway,
                new ObjectMapper(),
                16_384,
                2,
                40,
                3,
                2,
                false,
                duration -> { },
                limiter
        );

        client.generate(context());

        assertThatThrownBy(() -> client.generate(context()))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("minute request limit");
        assertThat(gateway.prompts).hasSize(5);
    }

    @Test
    void stopsPublishingWhenSecondReviewStillFails() {
        FakeGateway gateway = new FakeGateway(
                result(planJson(), "STOP"),
                result("소개", "STOP"),
                result("깨진 운영", "STOP"),
                result(failedReviewJson("ops-deployment/configuration"), "STOP"),
                result("수정한 운영", "STOP"),
                result(failedReviewJson("ops-deployment/configuration"), "STOP")
        );

        assertThatThrownBy(() -> client(gateway).generate(context()))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("review failed after repair")
                .hasMessageContaining("ops-deployment");
    }

    @Test
    void skipsTheSecondReviewWhenDisabled() {
        FakeGateway gateway = new FakeGateway(
                result(planJson(), "STOP"),
                result("?뚭컻", "STOP"),
                result("源⑥쭊 ?댁쁺", "STOP"),
                result(failedReviewJson("ops-deployment/configuration"), "STOP"),
                result("?섏젙???댁쁺", "STOP")
        );
        GeminiAiPostClient client = client(gateway, 2, 20, 3, 2, false);

        AiPostGenerateResponse response = client.generate(context());

        assertThat(response.content()).contains("?섏젙???댁쁺");
        assertThat(gateway.prompts.stream()
                .filter(prompt -> prompt.startsWith("POST_REVIEW")))
                .hasSize(1);
    }

    @Test
    void planPromptIncludesConfiguredSectionAndUnitLimits() {
        FakeGateway gateway = new FakeGateway(
                result(planJson(), "STOP"),
                result("?뚭컻", "STOP"),
                result("?댁쁺", "STOP"),
                result(successfulReviewJson(), "STOP")
        );

        client(gateway, 2, 20, 3, 2, false).generate(context());

        assertThat(gateway.prompts.getFirst())
                .contains("Use at most 3 sections.")
                .contains("Each section must contain 1-2 writing units");
    }

    private GeminiAiPostClient client(FakeGateway gateway) {
        return client(gateway, 2, 20, 3, 2, true);
    }

    private GeminiAiPostClient client(FakeGateway gateway, int maxSplitDepth, int maxGenerationCalls) {
        return client(gateway, maxSplitDepth, maxGenerationCalls, 3, 2, true);
    }

    private GeminiAiPostClient client(
            FakeGateway gateway,
            int maxSplitDepth,
            int maxGenerationCalls,
            int maxPlanSections,
            int maxUnitsPerSection,
            boolean secondReviewEnabled
    ) {
        return new GeminiAiPostClient(
                gateway,
                new ObjectMapper(),
                16_384,
                maxSplitDepth,
                maxGenerationCalls,
                maxPlanSections,
                maxUnitsPerSection,
                secondReviewEnabled,
                duration -> { },
                new GeminiRequestRateLimiter(new AdvancingClock())
        );
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

    private AiPostGenerationContext singleRequestContext() {
        return new AiPostGenerationContext(
                "Spring Boot operations",
                "scheduled auto posting",
                List.of(),
                List.of(),
                "beginner",
                "concise",
                "spring-boot",
                List.of("Previous Spring post"),
                true
        );
    }

    private String directPostJson() {
        return """
                {
                  "title": "Spring Boot operations",
                  "summary": "A compact checklist for Spring Boot operations.",
                  "content": "## Checklist\\n\\nKeep configuration small and observable.",
                  "tags": ["Spring Boot"],
                  "readTime": "3 min",
                  "recommendedTopics": ["Actuator"],
                  "recommendedCategorySlug": "spring-boot",
                  "thumbnailStyle": "code"
                }
                """;
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
                    {
                      "key": "introduction",
                      "heading": "Spring Boot 소개",
                      "brief": "주제와 필요성",
                      "units": [
                        {"key": "overview", "heading": "Spring Boot 소개", "brief": "주제와 필요성"}
                      ]
                    },
                    {
                      "key": "ops-deployment",
                      "heading": "운영 환경 적용",
                      "brief": "설정과 예제",
                      "units": [
                        {"key": "configuration", "heading": "운영 환경 적용", "brief": "설정과 예제"}
                      ]
                    }
                  ]
                }
                """;
    }

    private String planWithTwoUnitsJson() {
        return """
                {
                  "title": "Spring Boot 운영 설정",
                  "summary": "운영 환경 적용 방법을 설명합니다.",
                  "tags": ["Spring Boot", "운영"],
                  "readTime": "10분 읽기",
                  "recommendedTopics": ["Spring Profiles"],
                  "recommendedCategorySlug": "spring-boot",
                  "thumbnailStyle": "code",
                  "sections": [
                    {
                      "key": "ops",
                      "heading": "운영 환경 적용",
                      "brief": "운영 환경 구성",
                      "units": [
                        {"key": "env", "heading": "환경변수 구성", "brief": "환경변수 설정"},
                        {"key": "systemd", "heading": "systemd 설정", "brief": "systemd 서비스 설정"}
                      ]
                    }
                  ]
                }
                """;
    }

    private String planWithUnaffectedAndTwoUnitSectionJson() {
        return """
                {
                  "title": "Spring Boot 운영 설정",
                  "summary": "운영 환경 적용 방법을 설명합니다.",
                  "tags": ["Spring Boot", "운영"],
                  "readTime": "10분 읽기",
                  "recommendedTopics": ["Spring Profiles"],
                  "recommendedCategorySlug": "spring-boot",
                  "thumbnailStyle": "code",
                  "sections": [
                    {
                      "key": "introduction",
                      "heading": "소개",
                      "brief": "주제 소개",
                      "units": [
                        {"key": "overview", "heading": "소개", "brief": "주제 소개"}
                      ]
                    },
                    {
                      "key": "ops",
                      "heading": "운영 환경 적용",
                      "brief": "운영 환경 구성",
                      "units": [
                        {"key": "env", "heading": "환경변수 구성", "brief": "환경변수 설정"},
                        {"key": "systemd", "heading": "systemd 설정", "brief": "systemd 서비스 설정"}
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

    private String failedReviewJson(String contentKey) {
        return """
                {
                  "passed": false,
                  "issues": [
                    {
                      "contentKey": "%s",
                      "type": "BROKEN_CODE_BLOCK",
                      "severity": "ERROR",
                      "instruction": "코드 블록을 완결"
                    }
                  ]
                }
                """.formatted(contentKey);
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

        private List<String> promptsFor(String contentKey) {
            return prompts.stream()
                    .filter(prompt -> prompt.contains("contentKey: " + contentKey))
                    .toList();
        }
    }

    private String failedReviewForContentJson(String contentKey) {
        return """
                {
                  "passed": false,
                  "issues": [
                    {
                      "contentKey": "%s",
                      "type": "BROKEN_CODE_BLOCK",
                      "severity": "ERROR",
                      "instruction": "코드 블록을 완결"
                    }
                  ]
                }
                """.formatted(contentKey);
    }

    private String splitPlanJson() {
        return """
                {
                  "units": [
                    {"key": "service-file", "heading": "서비스 파일", "brief": "systemd 서비스 파일 설정"},
                    {"key": "restart", "heading": "재시작", "brief": "서비스 재시작과 확인"}
                  ]
                }
                """;
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
