package io.hyeongsi.devnotewebapp.ai.client;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.genai.Client;
import com.google.genai.errors.ApiException;
import com.google.genai.types.GenerateContentConfig;
import com.google.genai.types.GenerateContentResponse;
import io.hyeongsi.devnotewebapp.ai.dto.AiPostGenerateResponse;

import java.time.Clock;
import java.time.Duration;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Consumer;
import java.util.function.Supplier;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

public class GeminiAiPostClient implements AiPostClient {

    private static final Pattern STABLE_KEY = Pattern.compile("[a-z0-9]+(?:-[a-z0-9]+)*");

    private final GeminiModelGateway gateway;
    private final ObjectMapper objectMapper;
    private final int maxOutputTokens;
    private final int maxSplitDepth;
    private final int maxGenerationCalls;
    private final Consumer<Duration> sleeper;
    private final GeminiRequestRateLimiter requestRateLimiter;

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
        this.requestRateLimiter = new GeminiRequestRateLimiter(Clock.systemUTC());
    }

    GeminiAiPostClient(
            GeminiModelGateway gateway,
            ObjectMapper objectMapper,
            int maxOutputTokens,
            Consumer<Duration> sleeper
    ) {
        this(gateway, objectMapper, maxOutputTokens, 2, 40, sleeper, new GeminiRequestRateLimiter(Clock.systemUTC()));
    }

    GeminiAiPostClient(
            GeminiModelGateway gateway,
            ObjectMapper objectMapper,
            int maxOutputTokens,
            int maxSplitDepth,
            int maxGenerationCalls,
            Consumer<Duration> sleeper
    ) {
        this(
                gateway,
                objectMapper,
                maxOutputTokens,
                maxSplitDepth,
                maxGenerationCalls,
                sleeper,
                new GeminiRequestRateLimiter(Clock.systemUTC())
        );
    }

    GeminiAiPostClient(
            GeminiModelGateway gateway,
            ObjectMapper objectMapper,
            int maxOutputTokens,
            int maxSplitDepth,
            int maxGenerationCalls,
            Consumer<Duration> sleeper,
            GeminiRequestRateLimiter requestRateLimiter
    ) {
        this.gateway = gateway;
        this.objectMapper = objectMapper;
        this.maxOutputTokens = requirePositive(maxOutputTokens, "maxOutputTokens");
        this.maxSplitDepth = requirePositive(maxSplitDepth, "maxSplitDepth");
        this.maxGenerationCalls = requirePositive(maxGenerationCalls, "maxGenerationCalls");
        this.sleeper = sleeper;
        this.requestRateLimiter = requestRateLimiter;
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

        GeminiGenerationBudget generationBudget = new GeminiGenerationBudget(maxGenerationCalls);
        Map<String, List<GeminiGeneratedUnit>> sections = new LinkedHashMap<>();
        for (GeminiPostPlan.Section section : plan.sections()) {
            List<GeminiGeneratedUnit> units = section.units().stream()
                    .map(unit -> generateUnit(context, plan, section, unit, generationBudget))
                    .toList();
            if (units.stream().flatMap(unit -> unit.leaves().stream())
                    .anyMatch(unit -> unit.markdown() == null || unit.markdown().isBlank())) {
                throw new IllegalStateException("Gemini returned an empty unit in section: " + section.key());
            }
            sections.put(section.key(), units);
        }

        String content = assemble(plan, sections);
        GeminiPostReview review = parse(
                generateJson(buildReviewPrompt(plan, sections, content), reviewSchema()),
                GeminiPostReview.class,
                "review"
        );
        if (!review.passed()) {
            repairRejectedSections(context, plan, sections, review, generationBudget);
            content = assemble(plan, sections);
            GeminiPostReview secondReview = parse(
                    generateJson(buildReviewPrompt(plan, sections, content), reviewSchema()),
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

    private GeminiGeneratedUnit generateUnit(
            AiPostGenerationContext context,
            GeminiPostPlan plan,
            GeminiPostPlan.Section section,
            GeminiPostPlan.Unit unit,
            GeminiGenerationBudget budget
    ) {
        return generateUnit(
                context,
                plan,
                section,
                unit,
                section.key() + "/" + unit.key(),
                unit.heading(),
                unit.brief(),
                3,
                0,
                budget
        );
    }

    private GeminiGeneratedUnit generateUnit(
            AiPostGenerationContext context,
            GeminiPostPlan plan,
            GeminiPostPlan.Section section,
            GeminiPostPlan.Unit unit,
            String contentKey,
            String heading,
            String brief,
            int headingDepth,
            int splitDepth,
            GeminiGenerationBudget budget
    ) {
        GenerateContentConfig config = GenerateContentConfig.builder()
                .temperature(0.7f)
                .maxOutputTokens(maxOutputTokens)
                .responseMimeType("text/plain")
                .build();
        budget.consume("UNIT_GENERATION", contentKey);
        GeminiModelResult result = invoke(() -> gateway.generate(
                buildUnitPrompt(context, plan, section, contentKey, heading, brief), config
        ));
        if ("STOP".equals(result.finishReason())) {
            return GeminiGeneratedUnit.completed(contentKey, heading, brief, headingDepth, result.text());
        }
        if (!"MAX_TOKENS".equals(result.finishReason())) {
            requireStop(result);
        }
        GeminiModelResult retryResult = invoke(() -> gateway.generate(
                buildMaxTokensRetryPrompt(context, plan, section, unit, contentKey), config
        ));
        if ("STOP".equals(retryResult.finishReason())) {
            if (looksLikeSplitPlanJson(retryResult.text())) {
                GeminiUnitSplitPlan retrySplitPlan = parse(
                        retryResult.text(),
                        GeminiUnitSplitPlan.class,
                        "unit split plan"
                );
                return splitUnitWithPlan(
                        context,
                        plan,
                        section,
                        contentKey,
                        heading,
                        brief,
                        headingDepth,
                        splitDepth,
                        budget,
                        retrySplitPlan
                );
            }
            return GeminiGeneratedUnit.completed(contentKey, heading, brief, headingDepth, retryResult.text());
        }
        if (!"MAX_TOKENS".equals(retryResult.finishReason())) {
            requireStop(retryResult);
        }
        return splitUnit(
                context, plan, section, contentKey, heading, brief, headingDepth, splitDepth, budget
        );
    }

    private GeminiUnitSplitPlan requestSplitPlan(
            GeminiPostPlan.Section section,
            String contentKey,
            String heading,
            String brief
    ) {
        return parse(
                generateJson(buildSplitPlanPrompt(section, contentKey, heading, brief), splitPlanSchema()),
                GeminiUnitSplitPlan.class,
                "unit split plan"
        );
    }

    private void validateSplitPlan(String parentContentKey, GeminiUnitSplitPlan splitPlan) {
        if (splitPlan == null || splitPlan.units() == null
                || splitPlan.units().size() < 2 || splitPlan.units().size() > 5) {
            throw new IllegalStateException("Gemini split plan must contain 2-5 units: " + parentContentKey);
        }
        Set<String> keys = new HashSet<>();
        for (GeminiUnitSplitPlan.Unit unit : splitPlan.units()) {
            requirePlanText(unit.key());
            requireStableKey(unit.key(), "split unit");
            requirePlanText(unit.heading());
            requirePlanText(unit.brief());
            if (!keys.add(unit.key())) {
                throw new IllegalStateException("Gemini returned duplicate split unit keys: " + parentContentKey);
            }
        }
    }

    private GeminiGeneratedUnit splitUnit(
            AiPostGenerationContext context,
            GeminiPostPlan plan,
            GeminiPostPlan.Section section,
            String contentKey,
            String heading,
            String brief,
            int headingDepth,
            int splitDepth,
            GeminiGenerationBudget budget
    ) {
        if (splitDepth >= maxSplitDepth) {
            throw new IllegalStateException(
                    "Gemini generation did not complete: stage=UNIT_SPLIT_DEPTH, contentKey=" + contentKey
                            + ", depth=" + splitDepth + ", finishReason=MAX_TOKENS"
            );
        }

        GeminiUnitSplitPlan splitPlan = requestSplitPlan(section, contentKey, heading, brief);
        return splitUnitWithPlan(
                context,
                plan,
                section,
                contentKey,
                heading,
                brief,
                headingDepth,
                splitDepth,
                budget,
                splitPlan
        );
    }

    private GeminiGeneratedUnit splitUnitWithPlan(
            AiPostGenerationContext context,
            GeminiPostPlan plan,
            GeminiPostPlan.Section section,
            String contentKey,
            String heading,
            String brief,
            int headingDepth,
            int splitDepth,
            GeminiGenerationBudget budget,
            GeminiUnitSplitPlan splitPlan
    ) {
        validateSplitPlan(contentKey, splitPlan);
        List<GeminiGeneratedUnit> children = splitPlan.units().stream()
                .map(unit -> generateUnit(
                        context,
                        plan,
                        section,
                        new GeminiPostPlan.Unit(unit.key(), unit.heading(), unit.brief()),
                        contentKey + "/" + unit.key(),
                        unit.heading(),
                        unit.brief(),
                        headingDepth + 1,
                        splitDepth + 1,
                        budget
                ))
                .toList();
        return GeminiGeneratedUnit.branch(contentKey, heading, brief, headingDepth, children);
    }

    private boolean looksLikeSplitPlanJson(String text) {
        if (text == null) {
            return false;
        }
        String trimmed = text.trim();
        return trimmed.startsWith("{") && trimmed.contains("\"units\"");
    }

    private GeminiGeneratedUnit generateRepair(
            AiPostGenerationContext context,
            GeminiPostPlan plan,
            GeminiPostPlan.Section section,
            GeminiGeneratedUnit leaf,
            List<GeminiPostReview.Issue> issues,
            GeminiGenerationBudget budget
    ) {
        budget.consume("REPAIR", leaf.contentKey());
        GenerateContentConfig config = GenerateContentConfig.builder()
                .temperature(0.5f)
                .maxOutputTokens(maxOutputTokens)
                .responseMimeType("text/plain")
                .build();
        GeminiModelResult result = invoke(() -> gateway.generate(
                buildRepairPrompt(context, plan, section, leaf, issues),
                config
        ));
        if ("STOP".equals(result.finishReason())) {
            return GeminiGeneratedUnit.completed(
                    leaf.contentKey(), leaf.heading(), leaf.brief(), leaf.depth(), result.text()
            );
        }
        if (!"MAX_TOKENS".equals(result.finishReason())) {
            requireStop(result);
        }
        int splitDepth = Math.max(0, leaf.contentKey().split("/").length - 2);
        return splitUnit(
                context,
                plan,
                section,
                leaf.contentKey(),
                leaf.heading(),
                leaf.brief(),
                leaf.depth(),
                splitDepth,
                budget
        );
    }

    private GeminiModelResult invoke(Supplier<GeminiModelResult> request) {
        Duration[] delays = {Duration.ofSeconds(5), Duration.ofSeconds(15)};
        for (int attempt = 0; ; attempt++) {
            try {
                requestRateLimiter.acquire();
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
        Set<String> sectionKeys = new HashSet<>();
        Set<String> contentKeys = new HashSet<>();
        for (GeminiPostPlan.Section section : plan.sections()) {
            requirePlanText(section.key());
            requireStableKey(section.key(), "section");
            requirePlanText(section.heading());
            requirePlanText(section.brief());
            if (!sectionKeys.add(section.key())) {
                throw new IllegalStateException("Gemini returned duplicate section keys");
            }
            if (section.units() == null || section.units().isEmpty() || section.units().size() > 5) {
                throw new IllegalStateException("Gemini plan sections must contain 1-5 units");
            }
            for (GeminiPostPlan.Unit unit : section.units()) {
                requirePlanText(unit.key());
                requireStableKey(unit.key(), "unit");
                requirePlanText(unit.heading());
                requirePlanText(unit.brief());
                if (!contentKeys.add(section.key() + "/" + unit.key())) {
                    throw new IllegalStateException("Gemini returned duplicate content keys");
                }
            }
        }
    }

    private void requirePlanText(String value) {
        if (value == null || value.isBlank()) {
            throw new IllegalStateException("Gemini returned an incomplete post plan");
        }
    }

    private void requireStableKey(String value, String type) {
        if (!STABLE_KEY.matcher(value).matches()) {
            throw new IllegalStateException("Gemini returned an invalid " + type + " key: " + value);
        }
    }

    private String assemble(GeminiPostPlan plan, Map<String, List<GeminiGeneratedUnit>> sections) {
        return plan.sections().stream()
                .map(section -> renderSection(section, sections.get(section.key())))
                .collect(Collectors.joining("\n\n"));
    }

    private String renderSection(GeminiPostPlan.Section section, List<GeminiGeneratedUnit> units) {
        boolean includeUnitHeading = units.size() > 1;
        String body = units.stream()
                .map(unit -> renderUnit(unit, includeUnitHeading))
                .collect(Collectors.joining("\n\n"));
        return "## " + section.heading() + "\n\n" + body;
    }

    private String renderUnit(GeminiGeneratedUnit unit, boolean includeHeading) {
        String body = unit.children().isEmpty()
                ? unit.markdown()
                : unit.children().stream()
                        .map(child -> renderUnit(child, true))
                        .collect(Collectors.joining("\n\n"));
        if (!includeHeading) {
            return body;
        }
        return "#".repeat(unit.depth()) + " " + unit.heading() + "\n\n" + body;
    }

    private void repairRejectedSections(
            AiPostGenerationContext context,
            GeminiPostPlan plan,
            Map<String, List<GeminiGeneratedUnit>> sections,
            GeminiPostReview review,
            GeminiGenerationBudget generationBudget
    ) {
        Map<String, List<GeminiPostReview.Issue>> issuesByContent = review.issues().stream()
                .filter(issue -> "ERROR".equals(issue.severity()))
                .collect(Collectors.groupingBy(
                        GeminiPostReview.Issue::contentKey,
                        LinkedHashMap::new,
                        Collectors.toList()
                ));
        if (issuesByContent.isEmpty()) {
            throw new IllegalStateException("Gemini post review failed without repairable errors");
        }

        for (Map.Entry<String, List<GeminiPostReview.Issue>> entry : issuesByContent.entrySet()) {
            String contentKey = entry.getKey();
            GeminiPostPlan.Section section = plan.sections().stream()
                    .filter(candidate -> sections.get(candidate.key()).stream()
                            .flatMap(unit -> unit.leaves().stream())
                            .anyMatch(leaf -> leaf.contentKey().equals(contentKey)))
                    .findFirst()
                    .orElseThrow(() -> new IllegalStateException(
                            "Gemini review referenced an unknown content key: " + contentKey
                    ));
            List<GeminiGeneratedUnit> repairedUnits = new java.util.ArrayList<>();
            for (GeminiGeneratedUnit unit : sections.get(section.key())) {
                GeminiGeneratedUnit repairedUnit = unit;
                GeminiGeneratedUnit leaf = unit.leaves().stream()
                        .filter(candidate -> candidate.contentKey().equals(contentKey))
                        .findFirst()
                        .orElse(null);
                if (leaf != null) {
                    GeminiGeneratedUnit replacement = generateRepair(
                            context, plan, section, leaf, entry.getValue(), generationBudget
                    );
                    repairedUnit = repairedUnit.replaceLeaf(
                            leaf.contentKey(),
                            replacement
                    );
                }
                repairedUnits.add(repairedUnit);
            }
            sections.put(section.key(), List.copyOf(repairedUnits));
        }
    }

    private String renderSectionBody(List<GeminiGeneratedUnit> units) {
        boolean includeUnitHeading = units.size() > 1;
        return units.stream()
                .map(unit -> renderUnit(unit, includeUnitHeading))
                .collect(Collectors.joining("\n\n"));
    }

    private String describeIssues(GeminiPostReview review) {
        if (review.issues() == null || review.issues().isEmpty()) {
            return "no issue details";
        }
        return review.issues().stream()
                .map(issue -> issue.contentKey() + ":" + issue.type())
                .collect(Collectors.joining(", "));
    }

    String buildPlanPrompt(AiPostGenerationContext context) {
        return """
                POST_PLAN
                Design metadata and a detailed outline for a Korean developer blog post.
                Use a unique lowercase key with only letters, numbers, and hyphens for each section.
                Each section must contain 1-5 writing units with key, heading, and brief.
                Unit keys must also be stable lowercase identifiers so they can be used as sectionKey/unitKey.
                Prefer a narrower, practical outline over a broad one.
                Do not split the topic into too many subtopics.
                Focus on one topic and explain it at a normal depth rather than trying to cover everything.
                Keep the overall scope compact enough to avoid MAX_TOKENS.
                Mention where a code example is truly needed in the brief.

                Topic: %s
                Direction: %s
                Include keywords: %s
                Exclude keywords: %s
                Reader level: %s
                Desired length: %s
                Default category slug: %s
                Recent titles on similar topics: %s
                """.formatted(
                context.topic()
                , context.direction()
                , String.join(", ", context.keywords())
                , String.join(", ", context.excludedKeywords())
                , context.level()
                , context.lengthHint()
                , context.categorySlug()
                , context.recentTitles().isEmpty() ? "none" : String.join(" | ", context.recentTitles())
        );
    }

    private String buildUnitPrompt(
            AiPostGenerationContext context,
            GeminiPostPlan plan,
            GeminiPostPlan.Section section,
            String contentKey,
            String heading,
            String brief
    ) {
        return """
                SECTION_GENERATION
                Main topic: %s
                Post title: %s
                Reader level: %s
                sectionKey: %s
                contentKey: %s
                Unit heading: %s
                Writing goal: %s

                Write only the body for this unit in Korean Markdown.
                Do not include the section title or unit heading because the server assembles them.
                Keep the content practical, normal in length, and tightly focused on this one unit.
                Do not make it verbose. Do not add filler, repeated explanations, or extra subtopics.
                If an example is needed, include only the minimum useful example.
                Finish every paragraph and code block cleanly.
                """.formatted(
                context.topic(), plan.title(), context.level(), section.key(), contentKey, heading, brief
        ) + "\nWrite in a practical normal length and avoid unnecessary verbosity."
                + "\nDo not exceed MAX_TOKENS; remove repetitive filler and excessive extra detail.";
    }

    private String buildMaxTokensRetryPrompt(
            AiPostGenerationContext context,
            GeminiPostPlan plan,
            GeminiPostPlan.Section section,
            GeminiPostPlan.Unit unit,
            String contentKey
    ) {
        return """
                SECTION_RETRY_AFTER_MAX_TOKENS
                Main topic: %s
                Post title: %s
                Reader level: %s
                sectionKey: %s
                contentKey: %s
                Unit heading: %s
                Writing goal: %s

                The previous answer hit the output limit.
                Rewrite this unit from scratch in Korean Markdown.
                Keep the core explanation and only the minimum necessary example.
                Make it shorter, tighter, and more focused than before.
                Remove filler, repetition, and non-essential details.
                Do not include the section title or unit heading.
                Finish every sentence and code block cleanly.
                """.formatted(
                context.topic(), plan.title(), context.level(), section.key(), contentKey, unit.heading(), unit.brief()
        ) + "\nRewrite in a practical normal length and avoid unnecessary verbosity."
                + "\nDo not exceed MAX_TOKENS; keep only the core explanation and the minimum necessary examples.";
    }

    private String buildSplitPlanPrompt(
            GeminiPostPlan.Section section,
            String contentKey,
            String heading,
            String brief
    ) {
        return """
                UNIT_SPLIT_PLAN
                sectionKey: %s
                contentKey: %s
                unit heading: %s
                unit goal: %s

                Split this unit into 2-5 smaller, non-overlapping writing units.
                Each unit must have a stable lowercase key using only letters, numbers, and hyphens,
                plus a heading and a concrete brief. Return JSON only.
                """.formatted(section.key(), contentKey, heading, brief);
    }

    private String buildRepairPrompt(
            AiPostGenerationContext context,
            GeminiPostPlan plan,
            GeminiPostPlan.Section section,
            GeminiGeneratedUnit leaf,
            List<GeminiPostReview.Issue> issues
    ) {
        String instructions = issues.stream()
                .map(issue -> issue.type() + ": " + issue.instruction())
                .collect(Collectors.joining("\n"));
        return """
                SECTION_REPAIR
                Main topic: %s
                Post title: %s
                Reader level: %s
                Full outline: %s
                sectionKey: %s
                contentKey: %s
                Unit heading: %s
                Writing goal: %s

                Review failure reasons:
                %s

                Current unit content:
                %s

                Rewrite only this unit in Korean Markdown so the issues are fixed.
                Do not create content for other sections.
                Do not include the section title or unit heading.
                Keep it practical and concise.
                """.formatted(
                context.topic(),
                plan.title(),
                context.level(),
                plan.sections().stream().map(GeminiPostPlan.Section::heading).toList(),
                section.key(),
                leaf.contentKey(),
                leaf.heading(),
                leaf.brief(),
                instructions,
                leaf.markdown()
        );
    }

    private String buildReviewPrompt(
            GeminiPostPlan plan,
            Map<String, List<GeminiGeneratedUnit>> sections,
            String content
    ) {
        return """
                POST_REVIEW
                Review the following post for missing content, duplication, broken code blocks,
                mismatch between heading and body, and risky technical claims.
                Any issue that must be fixed must be returned as ERROR with its contentKey.

                Section list: %s

                Content:
                %s
                """.formatted(
                plan.sections().stream()
                        .flatMap(section -> sections.get(section.key()).stream())
                        .flatMap(unit -> unit.leaves().stream())
                        .map(leaf -> leaf.contentKey() + "=" + leaf.heading())
                        .toList(),
                content
        );
    }

    private Map<String, Object> planSchema() {
        Map<String, Object> string = Map.of("type", "string");
        Map<String, Object> key = Map.of(
                "type", "string",
                "pattern", "^[a-z0-9]+(?:-[a-z0-9]+)*$"
        );
        Map<String, Object> stringArray = Map.of("type", "array", "items", string);
        Map<String, Object> unit = Map.of(
                "type", "object",
                "properties", Map.of("key", key, "heading", string, "brief", string),
                "required", List.of("key", "heading", "brief")
        );
        Map<String, Object> section = Map.of(
                "type", "object",
                "properties", Map.of(
                        "key", key,
                        "heading", string,
                        "brief", string,
                        "units", Map.of(
                                "type", "array",
                                "items", unit,
                                "minItems", 1,
                                "maxItems", 5
                        )
                ),
                "required", List.of("key", "heading", "brief", "units")
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
                        "contentKey", string,
                        "type", string,
                        "severity", Map.of("type", "string", "enum", List.of("ERROR", "WARNING")),
                        "instruction", string
                ),
                "required", List.of("contentKey", "type", "severity", "instruction")
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

    private Map<String, Object> splitPlanSchema() {
        Map<String, Object> string = Map.of("type", "string");
        Map<String, Object> key = Map.of(
                "type", "string",
                "pattern", "^[a-z0-9]+(?:-[a-z0-9]+)*$"
        );
        Map<String, Object> unit = Map.of(
                "type", "object",
                "properties", Map.of("key", key, "heading", string, "brief", string),
                "required", List.of("key", "heading", "brief")
        );
        return Map.of(
                "type", "object",
                "properties", Map.of(
                        "units", Map.of(
                                "type", "array",
                                "items", unit,
                                "minItems", 2,
                                "maxItems", 5
                        )
                ),
                "required", List.of("units")
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
