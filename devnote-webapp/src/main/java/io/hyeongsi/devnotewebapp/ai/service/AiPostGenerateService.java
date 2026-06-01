package io.hyeongsi.devnotewebapp.ai.service;

import io.hyeongsi.devnotewebapp.ai.client.AiPostClient;
import io.hyeongsi.devnotewebapp.ai.dto.AiPostGenerateResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AiPostGenerateService {

    private final AiPostClient aiPostClient;

    public AiPostGenerateService(AiPostClient aiPostClient) {
        this.aiPostClient = aiPostClient;
    }

    public AiPostGenerateResponse generate(String topic) {
        if (topic == null || topic.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Topic is required");
        }

        AiPostGenerateResponse response = aiPostClient.generate(topic.trim());

        if (response == null || response.title() == null || response.title().isBlank()
                || response.content() == null || response.content().isBlank()) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "AI post generation returned empty response");
        }

        return response;
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
