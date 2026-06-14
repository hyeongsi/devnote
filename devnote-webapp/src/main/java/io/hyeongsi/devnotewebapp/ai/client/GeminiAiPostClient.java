package io.hyeongsi.devnotewebapp.ai.client;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.genai.Client;
import com.google.genai.types.GenerateContentConfig;
import com.google.genai.types.GenerateContentResponse;
import io.hyeongsi.devnotewebapp.ai.dto.AiPostGenerateResponse;

import java.util.List;
import java.util.Map;

public class GeminiAiPostClient implements AiPostClient {

    private final Client client;
    private final ObjectMapper objectMapper;
    private final String model;

    public GeminiAiPostClient(String apiKey, String model, ObjectMapper objectMapper) {
        this.client = Client.builder().apiKey(apiKey).build();
        this.objectMapper = objectMapper;
        this.model = model;
    }

    @Override
    public AiPostGenerateResponse generate(AiPostGenerationContext context) {
        GenerateContentConfig config = GenerateContentConfig.builder()
                .temperature(0.7f)
                .maxOutputTokens(8192)
                .responseMimeType("application/json")
                .responseJsonSchema(responseSchema())
                .build();
        GenerateContentResponse response = client.models.generateContent(model, buildPrompt(context), config);

        try {
            return objectMapper.readValue(response.text(), AiPostGenerateResponse.class);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Gemini returned an invalid post response", exception);
        }
    }

    private Map<String, Object> responseSchema() {
        Map<String, Object> string = Map.of("type", "string");
        Map<String, Object> stringArray = Map.of("type", "array", "items", string);
        return Map.of(
                "type", "object",
                "properties", Map.of(
                        "title", string,
                        "summary", string,
                        "content", string,
                        "tags", stringArray,
                        "readTime", string,
                        "recommendedTopics", stringArray,
                        "recommendedCategorySlug", string,
                        "thumbnailStyle", Map.of(
                                "type", "string",
                                "enum", List.of("ai", "laptop", "docker", "code", "chart", "security", "data", "monitor")
                        )
                ),
                "required", List.of(
                        "title", "summary", "content", "tags", "readTime",
                        "recommendedTopics", "recommendedCategorySlug", "thumbnailStyle"
                )
        );
    }

    String buildPrompt(AiPostGenerationContext context) {
        return """
                한국어 개발 블로그에 게시할 학습형 포스팅을 작성해줘.

                대략적인 주제: %s
                글 방향: %s
                포함할 키워드: %s
                제외할 키워드: %s
                독자 난이도: %s
                예상 분량: %s
                기본 카테고리 slug: %s
                최근 같은 주제의 게시글 제목: %s

                최근 제목과 겹치지 않는 구체적인 세부 주제를 선정해라.
                사실을 확신할 수 없는 내용은 단정하지 말고, 실무 코드 예제와 주의사항을 포함해라.
                content는 마크다운이며 주제 소개, 필요성, 핵심 개념, 실무 활용, 사용 방법,
                코드 예제, 주의사항, 추가 학습 항목, 요약을 포함해야 한다.
                태그는 3개 이상 10개 이하로 작성하고 응답 스키마를 정확히 지켜라.
                """.formatted(
                context.topic(),
                context.direction(),
                String.join(", ", context.keywords()),
                String.join(", ", context.excludedKeywords()),
                context.level(),
                context.lengthHint(),
                context.categorySlug(),
                context.recentTitles().isEmpty() ? "없음" : String.join(" | ", context.recentTitles())
        );
    }
}
