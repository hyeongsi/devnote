package io.hyeongsi.devnotewebapp.ai.service;

import io.hyeongsi.devnotewebapp.ai.client.AiPostClient;
import io.hyeongsi.devnotewebapp.ai.client.AiPostGenerationContext;
import io.hyeongsi.devnotewebapp.ai.draft.AiPostDraft;
import io.hyeongsi.devnotewebapp.ai.draft.AiPostDraftDtos;
import io.hyeongsi.devnotewebapp.ai.draft.AiPostDraftRepository;
import io.hyeongsi.devnotewebapp.ai.dto.AiPostGenerateRequest;
import io.hyeongsi.devnotewebapp.ai.dto.AiPostGenerateResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class AiPostGenerateService {

    private static final Logger log = LoggerFactory.getLogger(AiPostGenerateService.class);

    private final AiPostClient aiPostClient;
    private final AiPostDraftRepository draftRepository;
    private final Clock clock;

    public AiPostGenerateService(
            AiPostClient aiPostClient,
            AiPostDraftRepository draftRepository,
            Clock clock
    ) {
        this.aiPostClient = aiPostClient;
        this.draftRepository = draftRepository;
        this.clock = clock;
    }

    public AiPostDraftDtos.GeneratedDraft generate(String topic) {
        return generate(new AiPostGenerateRequest(topic, "", List.of(), List.of(), "초급도 이해할 수 있게", "보통"));
    }

    public AiPostDraftDtos.GeneratedDraft generate(AiPostGenerateRequest request) {
        String topic = request == null ? null : request.topic();
        if (topic == null || topic.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Topic is required");
        }
        String normalizedTopic = topic.trim();
        long startedAt = System.nanoTime();
        log.info("ai-generate request started source=MANUAL topic=\"{}\"", normalizedTopic);

        try {
            AiPostGenerateResponse response = aiPostClient.generate(new AiPostGenerationContext(
                    normalizedTopic,
                    normalize(request.direction()),
                    safeList(request.keywords()),
                    safeList(request.excludedKeywords()),
                    defaultValue(request.level(), "초급도 이해할 수 있게"),
                    defaultValue(request.lengthHint(), "보통"),
                    "",
                    List.of()
            ));

            if (response == null || response.title() == null || response.title().isBlank()
                    || response.content() == null || response.content().isBlank()) {
                throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "AI post generation returned empty response");
            }

            AiPostDraft draft = draftRepository.save(new AiPostDraft(
                    normalizedTopic,
                    response,
                    LocalDateTime.now(clock)
            ));
            log.info(
                    "ai-generate request completed source=MANUAL topic=\"{}\" draftId={} title=\"{}\" durationMs={}",
                    normalizedTopic,
                    draft.getId(),
                    response.title(),
                    elapsedMillis(startedAt)
            );
            return new AiPostDraftDtos.GeneratedDraft(draft.getId(), response);
        } catch (RuntimeException exception) {
            log.error(
                    "ai-generate request failed source=MANUAL topic=\"{}\" errorType={} message=\"{}\" durationMs={}",
                    normalizedTopic,
                    exception.getClass().getSimpleName(),
                    safeMessage(exception),
                    elapsedMillis(startedAt)
            );
            throw exception;
        }
    }

    private List<String> safeList(List<String> values) {
        return values == null ? List.of() : values.stream().filter(value -> value != null && !value.isBlank()).toList();
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim();
    }

    private String defaultValue(String value, String fallback) {
        String normalized = normalize(value);
        return normalized.isBlank() ? fallback : normalized;
    }

    private long elapsedMillis(long startedAt) {
        return (System.nanoTime() - startedAt) / 1_000_000L;
    }

    private String safeMessage(RuntimeException exception) {
        String message = exception.getMessage();
        return message == null || message.isBlank() ? exception.getClass().getSimpleName() : message;
    }

    String buildPrompt(String topic) {
        return """
                사용자가 입력한 주제에 대해 먼저 깊게 학습하고, 학습한 내용을 개발 블로그 독자에게 설명하는 글로 작성해줘.

                주제: %s

                글은 단순 소개가 아니라 학습형 포스팅이어야 한다.
                다음 내용을 반드시 포함해줘.

                - 주제 소개
                - 왜 알아야 하는지
                - 핵심 개념
                - 부수 개념
                - 필수 숙지 개념
                - 실무 활용 방식
                - 간단한 사용 방법
                - 추가 활용 방안
                - 주의사항
                - 추가로 알면 좋은 항목
                - 요약 정리

                응답은 JSON 형식으로 반환해줘.
                필드는 title, summary, content, tags, readTime, recommendedTopics, recommendedCategorySlug, thumbnailStyle을 사용해줘.
                content는 마크다운 형식으로 작성해줘.
                """.formatted(topic);
    }
}
