package io.hyeongsi.devnotewebapp.ai.client;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.genai.Client;
import com.google.genai.errors.ApiException;
import com.google.genai.types.GenerateContentConfig;
import com.google.genai.types.GenerateContentResponse;
import io.hyeongsi.devnotewebapp.ai.dto.AiPostGenerateResponse;

import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Consumer;
import java.util.function.Supplier;
import java.util.stream.Collectors;

public class GeminiAiPostClient implements AiPostClient {

    private final GeminiModelGateway gateway;
    private final ObjectMapper objectMapper;
    private final int maxOutputTokens;
    private final int maxSplitDepth;
    private final int maxGenerationCalls;
    private final Consumer<Duration> sleeper;

    public GeminiAiPostClient(String apiKey, String model, ObjectMapper objectMapper) {
        this(apiKey, model, objectMapper, 16_384);
    }

    public GeminiAiPostClient(String apiKey, String model, ObjectMapper objectMapper, int maxOutputTokens) {
        this(apiKey, model, objectMapper, maxOutputTokens, 2, 40);
    }

    public GeminiAiPostClient(
            String apiKey,
            String model,
            ObjectMapper objectMapper,
            int maxOutputTokens,
            int maxSplitDepth,
            int maxGenerationCalls
    ) {
        Client client = Client.builder().apiKey(apiKey).build();
        this.gateway = (prompt, config) -> toResult(client.models.generateContent(model, prompt, config));
        this.objectMapper = objectMapper;
        this.maxOutputTokens = requirePositive(maxOutputTokens, "maxOutputTokens");
        this.maxSplitDepth = requirePositive(maxSplitDepth, "maxSplitDepth");
        this.maxGenerationCalls = requirePositive(maxGenerationCalls, "maxGenerationCalls");
        this.sleeper = GeminiAiPostClient::sleep;
    }

    GeminiAiPostClient(
            GeminiModelGateway gateway,
            ObjectMapper objectMapper,
            int maxOutputTokens,
            Consumer<Duration> sleeper
    ) {
        this(gateway, objectMapper, maxOutputTokens, 2, 40, sleeper);
    }

    GeminiAiPostClient(
            GeminiModelGateway gateway,
            ObjectMapper objectMapper,
            int maxOutputTokens,
            int maxSplitDepth,
            int maxGenerationCalls,
            Consumer<Duration> sleeper
    ) {
        this.gateway = gateway;
        this.objectMapper = objectMapper;
        this.maxOutputTokens = requirePositive(maxOutputTokens, "maxOutputTokens");
        this.maxSplitDepth = requirePositive(maxSplitDepth, "maxSplitDepth");
        this.maxGenerationCalls = requirePositive(maxGenerationCalls, "maxGenerationCalls");
        this.sleeper = sleeper;
    }

    private static int requirePositive(int value, String name) {
        if (value < 1) {
            throw new IllegalArgumentException(name + " must be at least 1");
        }
        return value;
    }

    @Override
    public AiPostGenerateResponse generate(AiPostGenerationContext context) {
        GeminiPostPlan plan = parse(
                generateJson(buildPlanPrompt(context), planSchema()),
                GeminiPostPlan.class,
                "plan"
        );
        validatePlan(plan);

        Map<String, String> sections = new LinkedHashMap<>();
        for (GeminiPostPlan.Section section : plan.sections()) {
            String markdown = generateSection(context, plan, section);
            if (markdown == null || markdown.isBlank()) {
                throw new IllegalStateException("Gemini returned an empty section: " + section.key());
            }
            sections.put(section.key(), markdown.strip());
        }

        String content = assemble(plan, sections);
        GeminiPostReview review = parse(
                generateJson(buildReviewPrompt(plan, content), reviewSchema()),
                GeminiPostReview.class,
                "review"
        );
        if (!review.passed()) {
            repairRejectedSections(context, plan, sections, review);
            content = assemble(plan, sections);
            GeminiPostReview secondReview = parse(
                    generateJson(buildReviewPrompt(plan, content), reviewSchema()),
                    GeminiPostReview.class,
                    "review"
            );
            if (!secondReview.passed()) {
                throw new IllegalStateException(
                        "Gemini post review failed after repair: " + describeIssues(secondReview)
                );
            }
        }

        return new AiPostGenerateResponse(
                plan.title(),
                plan.summary(),
                content,
                plan.tags(),
                plan.readTime(),
                plan.recommendedTopics(),
                plan.recommendedCategorySlug(),
                plan.thumbnailStyle()
        );
    }

    private String generateJson(String prompt, Map<String, Object> schema) {
        GenerateContentConfig config = GenerateContentConfig.builder()
                .temperature(0.4f)
                .maxOutputTokens(Math.min(maxOutputTokens, 4_096))
                .responseMimeType("application/json")
                .responseJsonSchema(schema)
                .build();
        return requireStop(invoke(() -> gateway.generate(prompt, config)));
    }

    private String generateSection(
            AiPostGenerationContext context,
            GeminiPostPlan plan,
            GeminiPostPlan.Section section
    ) {
        GenerateContentConfig config = GenerateContentConfig.builder()
                .temperature(0.7f)
                .maxOutputTokens(maxOutputTokens)
                .responseMimeType("text/plain")
                .build();
        GeminiModelResult result = invoke(() -> gateway.generate(buildSectionPrompt(context, plan, section), config));
        if ("MAX_TOKENS".equals(result.finishReason())) {
            result = invoke(() -> gateway.generate(buildMaxTokensRetryPrompt(context, plan, section), config));
        }
        return requireStop(result);
    }

    private String generateRepair(
            AiPostGenerationContext context,
            GeminiPostPlan plan,
            GeminiPostPlan.Section section,
            String currentContent,
            List<GeminiPostReview.Issue> issues
    ) {
        GenerateContentConfig config = GenerateContentConfig.builder()
                .temperature(0.5f)
                .maxOutputTokens(maxOutputTokens)
                .responseMimeType("text/plain")
                .build();
        GeminiModelResult result = invoke(() -> gateway.generate(
                buildRepairPrompt(context, plan, section, currentContent, issues),
                config
        ));
        return requireStop(result);
    }

    private GeminiModelResult invoke(Supplier<GeminiModelResult> request) {
        Duration[] delays = {Duration.ofSeconds(5), Duration.ofSeconds(15)};
        for (int attempt = 0; ; attempt++) {
            try {
                return request.get();
            } catch (ApiException exception) {
                if (exception.code() != 429 || attempt >= delays.length) {
                    throw exception;
                }
                sleeper.accept(delays[attempt]);
            }
        }
    }

    private String requireStop(GeminiModelResult result) {
        if (result == null || !"STOP".equals(result.finishReason())) {
            String reason = result == null ? "UNKNOWN" : result.finishReason();
            throw new IllegalStateException("Gemini generation did not complete: finishReason=" + reason);
        }
        return result.text();
    }

    private <T> T parse(String json, Class<T> type, String responseType) {
        try {
            return objectMapper.readValue(json, type);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Gemini returned an invalid " + responseType + " response", exception);
        }
    }

    private void validatePlan(GeminiPostPlan plan) {
        if (plan == null || plan.title() == null || plan.title().isBlank()
                || plan.sections() == null || plan.sections().isEmpty()) {
            throw new IllegalStateException("Gemini returned an incomplete post plan");
        }
        long uniqueKeys = plan.sections().stream().map(GeminiPostPlan.Section::key).distinct().count();
        if (uniqueKeys != plan.sections().size()) {
            throw new IllegalStateException("Gemini returned duplicate section keys");
        }
    }

    private String assemble(GeminiPostPlan plan, Map<String, String> sections) {
        return plan.sections().stream()
                .map(section -> "## " + section.heading() + "\n\n" + sections.get(section.key()))
                .collect(Collectors.joining("\n\n"));
    }

    private void repairRejectedSections(
            AiPostGenerationContext context,
            GeminiPostPlan plan,
            Map<String, String> sections,
            GeminiPostReview review
    ) {
        Map<String, List<GeminiPostReview.Issue>> issuesBySection = review.issues().stream()
                .filter(issue -> "ERROR".equals(issue.severity()))
                .collect(Collectors.groupingBy(
                        GeminiPostReview.Issue::sectionKey,
                        LinkedHashMap::new,
                        Collectors.toList()
                ));
        if (issuesBySection.isEmpty()) {
            throw new IllegalStateException("Gemini post review failed without repairable errors");
        }

        for (Map.Entry<String, List<GeminiPostReview.Issue>> entry : issuesBySection.entrySet()) {
            GeminiPostPlan.Section section = plan.sections().stream()
                    .filter(candidate -> candidate.key().equals(entry.getKey()))
                    .findFirst()
                    .orElseThrow(() -> new IllegalStateException(
                            "Gemini review referenced an unknown section: " + entry.getKey()
                    ));
            String replacement = generateRepair(
                    context,
                    plan,
                    section,
                    sections.get(section.key()),
                    entry.getValue()
            );
            if (replacement == null || replacement.isBlank()) {
                throw new IllegalStateException("Gemini returned an empty repaired section: " + section.key());
            }
            sections.put(section.key(), replacement.strip());
        }
    }

    private String describeIssues(GeminiPostReview review) {
        if (review.issues() == null || review.issues().isEmpty()) {
            return "no issue details";
        }
        return review.issues().stream()
                .map(issue -> issue.sectionKey() + ":" + issue.type())
                .collect(Collectors.joining(", "));
    }

    String buildPlanPrompt(AiPostGenerationContext context) {
        return """
                POST_PLAN
                한국어 개발 블로그 포스팅의 메타데이터와 상세 목차를 설계해라.
                각 섹션에는 영문 소문자와 하이픈으로 된 고유한 key를 부여해라.
                글의 깊이에 필요한 만큼 섹션을 구성하고, 코드 예제가 필요한 위치를 brief에 명시해라.

                주제: %s
                글 방향: %s
                포함할 키워드: %s
                제외할 키워드: %s
                독자 난이도: %s
                예상 분량: %s
                기본 카테고리 slug: %s
                최근 같은 주제의 게시글 제목: %s
                """.formatted(
                context.topic(), context.direction(), String.join(", ", context.keywords()),
                String.join(", ", context.excludedKeywords()), context.level(), context.lengthHint(),
                context.categorySlug(), context.recentTitles().isEmpty() ? "없음" : String.join(" | ", context.recentTitles())
        );
    }

    private String buildSectionPrompt(
            AiPostGenerationContext context,
            GeminiPostPlan plan,
            GeminiPostPlan.Section section
    ) {
        return """
                SECTION_GENERATION
                전체 주제: %s
                글 제목: %s
                독자 난이도: %s
                sectionKey: %s
                섹션 제목: %s
                작성 목표: %s

                이 섹션의 본문만 한국어 Markdown으로 작성해라.
                섹션 제목은 서버가 조립하므로 포함하지 마라.
                설명의 깊이와 코드 예제 수를 임의로 축소하지 말고 주제를 충분히 이해시키는 데 필요한 내용을 작성해라.
                코드 블록과 문장을 반드시 완결해라.
                """.formatted(
                context.topic(), plan.title(), context.level(), section.key(), section.heading(), section.brief()
        );
    }

    private String buildMaxTokensRetryPrompt(
            AiPostGenerationContext context,
            GeminiPostPlan plan,
            GeminiPostPlan.Section section
    ) {
        return """
                SECTION_RETRY_AFTER_MAX_TOKENS
                전체 주제: %s
                글 제목: %s
                독자 난이도: %s
                sectionKey: %s
                섹션 제목: %s
                작성 목표: %s

                이전 응답이 출력 한도에 도달했다. 핵심 설명과 필요한 예제의 품질은 유지하되
                반복되는 설명을 제거하고 이 섹션의 본문을 처음부터 완결된 한국어 Markdown으로 다시 작성해라.
                섹션 제목은 포함하지 말고 코드 블록과 문장을 반드시 닫아라.
                """.formatted(
                context.topic(), plan.title(), context.level(), section.key(), section.heading(), section.brief()
        );
    }

    private String buildRepairPrompt(
            AiPostGenerationContext context,
            GeminiPostPlan plan,
            GeminiPostPlan.Section section,
            String currentContent,
            List<GeminiPostReview.Issue> issues
    ) {
        String instructions = issues.stream()
                .map(issue -> issue.type() + ": " + issue.instruction())
                .collect(Collectors.joining("\n"));
        return """
                SECTION_REPAIR
                전체 주제: %s
                글 제목: %s
                독자 난이도: %s
                전체 목차: %s
                sectionKey: %s
                섹션 제목: %s
                작성 목표: %s

                검수 실패 사유:
                %s

                현재 섹션 본문:
                %s

                검수 실패 사유를 해결한 이 섹션의 전체 본문만 한국어 Markdown으로 다시 작성해라.
                다른 섹션의 내용을 만들거나 섹션 제목을 포함하지 마라.
                """.formatted(
                context.topic(),
                plan.title(),
                context.level(),
                plan.sections().stream().map(GeminiPostPlan.Section::heading).toList(),
                section.key(),
                section.heading(),
                section.brief(),
                instructions,
                currentContent
        );
    }

    private String buildReviewPrompt(GeminiPostPlan plan, String content) {
        return """
                POST_REVIEW
                다음 게시글을 검수해라. 누락, 중복, 깨진 코드 블록, 제목과 본문의 불일치,
                위험한 기술적 단정을 찾아라. 수정이 필요한 문제는 반드시 해당 sectionKey와 함께 ERROR로 반환해라.

                섹션 목록: %s

                본문:
                %s
                """.formatted(
                plan.sections().stream().map(section -> section.key() + "=" + section.heading()).toList(),
                content
        );
    }

    private Map<String, Object> planSchema() {
        Map<String, Object> string = Map.of("type", "string");
        Map<String, Object> stringArray = Map.of("type", "array", "items", string);
        Map<String, Object> section = Map.of(
                "type", "object",
                "properties", Map.of("key", string, "heading", string, "brief", string),
                "required", List.of("key", "heading", "brief")
        );
        return Map.of(
                "type", "object",
                "properties", Map.of(
                        "title", string,
                        "summary", string,
                        "tags", stringArray,
                        "readTime", string,
                        "recommendedTopics", stringArray,
                        "recommendedCategorySlug", string,
                        "thumbnailStyle", Map.of(
                                "type", "string",
                                "enum", List.of("ai", "laptop", "docker", "code", "chart", "security", "data", "monitor")
                        ),
                        "sections", Map.of("type", "array", "items", section)
                ),
                "required", List.of(
                        "title", "summary", "tags", "readTime", "recommendedTopics",
                        "recommendedCategorySlug", "thumbnailStyle", "sections"
                )
        );
    }

    private Map<String, Object> reviewSchema() {
        Map<String, Object> string = Map.of("type", "string");
        Map<String, Object> issue = Map.of(
                "type", "object",
                "properties", Map.of(
                        "sectionKey", string,
                        "type", string,
                        "severity", Map.of("type", "string", "enum", List.of("ERROR", "WARNING")),
                        "instruction", string
                ),
                "required", List.of("sectionKey", "type", "severity", "instruction")
        );
        return Map.of(
                "type", "object",
                "properties", Map.of(
                        "passed", Map.of("type", "boolean"),
                        "issues", Map.of("type", "array", "items", issue)
                ),
                "required", List.of("passed", "issues")
        );
    }

    private static GeminiModelResult toResult(GenerateContentResponse response) {
        return new GeminiModelResult(response.text(), response.finishReason().toString());
    }

    private static void sleep(Duration duration) {
        try {
            Thread.sleep(duration);
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Interrupted while waiting to retry Gemini", exception);
        }
    }
}
