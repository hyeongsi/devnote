package io.hyeongsi.devnotewebapp.ai;

import io.hyeongsi.devnotewebapp.ai.client.AiPostClient;
import io.hyeongsi.devnotewebapp.ai.dto.AiPostGenerateResponse;
import io.hyeongsi.devnotewebapp.ai.service.AiPostGenerateService;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class AiPostGenerateServiceTest {

    @Test
    void generateReturnsLearningPostDraftFromClient() {
        AiPostClient aiPostClient = topic -> new AiPostGenerateResponse(
                "Spring Security를 실무 관점에서 이해하기",
                "Spring Security의 핵심 개념과 실무 활용 방식을 정리합니다.",
                "## Spring Security란?\n\n학습형 본문입니다.",
                List.of("Spring Security", "Spring Boot"),
                "8분 읽기",
                List.of("JWT 인증 방식", "OAuth2 로그인"),
                "spring-boot",
                "laptop"
        );
        AiPostGenerateService service = new AiPostGenerateService(aiPostClient);

        AiPostGenerateResponse response = service.generate(" Spring Security ");

        assertThat(response.title()).contains("Spring Security");
        assertThat(response.content()).contains("## Spring Security");
        assertThat(response.tags()).containsExactly("Spring Security", "Spring Boot");
        assertThat(response.recommendedCategorySlug()).isEqualTo("spring-boot");
    }

    @Test
    void generateRejectsBlankTopic() {
        AiPostGenerateService service = new AiPostGenerateService(topic -> null);

        assertThatThrownBy(() -> service.generate("   "))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Topic is required");
    }
}
