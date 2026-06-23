package io.hyeongsi.devnotewebapp.ai;

import io.hyeongsi.devnotewebapp.ai.client.AiPostClient;
import io.hyeongsi.devnotewebapp.ai.draft.AiPostDraft;
import io.hyeongsi.devnotewebapp.ai.draft.AiPostDraftDtos;
import io.hyeongsi.devnotewebapp.ai.draft.AiPostDraftRepository;
import io.hyeongsi.devnotewebapp.ai.draft.AiPostDraftStatus;
import io.hyeongsi.devnotewebapp.ai.dto.AiPostGenerateResponse;
import io.hyeongsi.devnotewebapp.ai.service.AiPostGenerateService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(OutputCaptureExtension.class)
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
        AiPostDraftRepository draftRepository = mock(AiPostDraftRepository.class);
        when(draftRepository.save(any(AiPostDraft.class))).thenAnswer(invocation -> {
            AiPostDraft draft = invocation.getArgument(0);
            ReflectionTestUtils.setField(draft, "id", 41L);
            return draft;
        });
        AiPostGenerateService service = new AiPostGenerateService(
                aiPostClient,
                draftRepository,
                Clock.fixed(Instant.parse("2026-06-23T03:00:00Z"), ZoneId.of("Asia/Seoul"))
        );

        AiPostDraftDtos.GeneratedDraft response = service.generate(" Spring Security ");

        assertThat(response.draftId()).isEqualTo(41L);
        assertThat(response.result().title()).contains("Spring Security");
        assertThat(response.result().content()).contains("## Spring Security");
        assertThat(response.result().tags()).containsExactly("Spring Security", "Spring Boot");
        assertThat(response.result().recommendedCategorySlug()).isEqualTo("spring-boot");
        verify(draftRepository).save(org.mockito.ArgumentMatchers.argThat(draft ->
                draft.getTopic().equals("Spring Security")
                        && draft.getStatus() == AiPostDraftStatus.DRAFT
        ));
    }

    @Test
    void generateRejectsBlankTopic() {
        AiPostGenerateService service = new AiPostGenerateService(
                topic -> null,
                mock(AiPostDraftRepository.class),
                Clock.systemUTC()
        );

        assertThatThrownBy(() -> service.generate("   "))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Topic is required");
    }

    @Test
    void generateDoesNotSaveDraftWhenClientFails() {
        AiPostDraftRepository draftRepository = mock(AiPostDraftRepository.class);
        AiPostGenerateService service = new AiPostGenerateService(
                topic -> { throw new IllegalStateException("generation failed"); },
                draftRepository,
                Clock.systemUTC()
        );

        assertThatThrownBy(() -> service.generate("Spring Security"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("generation failed");
        verify(draftRepository, never()).save(any());
    }

    @Test
    void generateLogsStartAndSuccessWithoutContent(CapturedOutput output) {
        AiPostDraftRepository draftRepository = mock(AiPostDraftRepository.class);
        when(draftRepository.save(any(AiPostDraft.class))).thenAnswer(invocation -> {
            AiPostDraft draft = invocation.getArgument(0);
            ReflectionTestUtils.setField(draft, "id", 41L);
            return draft;
        });
        AiPostGenerateService service = new AiPostGenerateService(
                topic -> new AiPostGenerateResponse(
                        "Spring Security guide",
                        "summary",
                        "## private generated content",
                        List.of("Security"),
                        "8遺??쎄린",
                        List.of("OAuth2"),
                        "spring",
                        "laptop"
                ),
                draftRepository,
                Clock.fixed(Instant.parse("2026-06-23T03:00:00Z"), ZoneId.of("Asia/Seoul"))
        );

        service.generate("Spring Security");

        assertThat(output).contains("ai-generate request started");
        assertThat(output).contains("source=MANUAL");
        assertThat(output).contains("topic=\"Spring Security\"");
        assertThat(output).contains("ai-generate request completed");
        assertThat(output).contains("draftId=41");
        assertThat(output).doesNotContain("private generated content");
    }

    @Test
    void generateLogsFailureWithoutSavingDraft(CapturedOutput output) {
        AiPostDraftRepository draftRepository = mock(AiPostDraftRepository.class);
        AiPostGenerateService service = new AiPostGenerateService(
                topic -> { throw new IllegalStateException("generation failed"); },
                draftRepository,
                Clock.systemUTC()
        );

        assertThatThrownBy(() -> service.generate("Spring Security"))
                .isInstanceOf(IllegalStateException.class);

        assertThat(output).contains("ai-generate request failed");
        assertThat(output).contains("topic=\"Spring Security\"");
        assertThat(output).contains("errorType=IllegalStateException");
        verify(draftRepository, never()).save(any());
    }
}
