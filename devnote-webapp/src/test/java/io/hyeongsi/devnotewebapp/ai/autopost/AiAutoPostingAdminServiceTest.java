package io.hyeongsi.devnotewebapp.ai.autopost;

import io.hyeongsi.devnotewebapp.ai.draft.AiPostDraft;
import io.hyeongsi.devnotewebapp.ai.draft.AiPostDraftDtos;
import io.hyeongsi.devnotewebapp.ai.draft.AiPostDraftRepository;
import io.hyeongsi.devnotewebapp.ai.draft.AiPostDraftStatus;
import io.hyeongsi.devnotewebapp.ai.dto.AiPostGenerateResponse;
import io.hyeongsi.devnotewebapp.category.Category;
import io.hyeongsi.devnotewebapp.category.CategoryRepository;
import io.hyeongsi.devnotewebapp.post.PostCreateRequest;
import io.hyeongsi.devnotewebapp.post.PostDetailResponse;
import io.hyeongsi.devnotewebapp.post.PostService;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Pageable;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AiAutoPostingAdminServiceTest {

    private static final Clock CLOCK = Clock.fixed(
            Instant.parse("2026-06-23T03:00:00Z"),
            ZoneId.of("Asia/Seoul")
    );

    @Test
    void runsCombinesAutomaticRunsAndDraftsByMostRecentTime() {
        AiPostRunRepository runRepository = mock(AiPostRunRepository.class);
        AiPostDraftRepository draftRepository = mock(AiPostDraftRepository.class);
        AiPostTopic topic = new AiPostTopic(
                "JPA indexing",
                new Category("jpa", "JPA", "JPA", true, 1),
                1,
                true
        );
        AiPostRun run = new AiPostRun(topic, LocalDateTime.parse("2026-06-23T10:00:00"));
        ReflectionTestUtils.setField(run, "id", 7L);
        AiPostDraft draft = draft("Spring Security", LocalDateTime.parse("2026-06-23T11:00:00"));
        ReflectionTestUtils.setField(draft, "id", 41L);
        when(runRepository.findRecentRuns(20)).thenReturn(List.of(run));
        when(draftRepository.findAllByOrderByCreatedAtDescIdDesc(any(Pageable.class))).thenReturn(List.of(draft));

        List<AiPostDraftDtos.HistoryItem> history = service(runRepository, draftRepository, mock(PostService.class)).runs();

        assertThat(history).extracting(AiPostDraftDtos.HistoryItem::topic)
                .containsExactly("Spring Security", "JPA indexing");
        assertThat(history.getFirst().loadable()).isTrue();
        assertThat(history.getFirst().status()).isEqualTo("DRAFT");
        assertThat(history.get(1).loadable()).isFalse();
    }

    @Test
    void draftReturnsOnlyLoadableDraft() {
        AiPostDraftRepository draftRepository = mock(AiPostDraftRepository.class);
        AiPostDraft draft = draft("Spring Security", LocalDateTime.parse("2026-06-23T11:00:00"));
        ReflectionTestUtils.setField(draft, "id", 41L);
        when(draftRepository.findById(41L)).thenReturn(Optional.of(draft));

        AiPostDraftDtos.DraftDetail detail = service(
                mock(AiPostRunRepository.class), draftRepository, mock(PostService.class)
        ).draft(41L);

        assertThat(detail.id()).isEqualTo(41L);
        assertThat(detail.topic()).isEqualTo("Spring Security");
        assertThat(detail.content()).contains("Spring Security");

        draft.publish(9L, LocalDateTime.parse("2026-06-23T12:00:00"));
        assertThatThrownBy(() -> service(
                mock(AiPostRunRepository.class), draftRepository, mock(PostService.class)
        ).draft(41L)).isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("409");
    }

    @Test
    void publishCreatesPostAndMarksDraftPublished() {
        AiPostDraftRepository draftRepository = mock(AiPostDraftRepository.class);
        PostService postService = mock(PostService.class);
        AiPostDraft draft = draft("Spring Security", LocalDateTime.parse("2026-06-23T11:00:00"));
        ReflectionTestUtils.setField(draft, "id", 41L);
        PostCreateRequest request = new PostCreateRequest(
                "spring-security", 1L, "Spring Security", "summary", "8분 읽기",
                "laptop", "## content", List.of("Security")
        );
        PostDetailResponse saved = new PostDetailResponse(
                99L, "spring-security", "Spring", "spring", "Spring Security", "summary",
                "2026.06.23", "8분 읽기", 0, List.of("Security"), "laptop", "## content"
        );
        when(draftRepository.findById(41L)).thenReturn(Optional.of(draft));
        when(postService.createPost(request)).thenReturn(saved);

        PostDetailResponse response = service(
                mock(AiPostRunRepository.class), draftRepository, postService
        ).publishDraft(41L, new AiPostDraftDtos.PublishDraftRequest(request));

        assertThat(response.id()).isEqualTo(99L);
        assertThat(draft.getStatus()).isEqualTo(AiPostDraftStatus.PUBLISHED);
        assertThat(draft.getPostId()).isEqualTo(99L);
        verify(postService).createPost(request);
    }

    private AiAutoPostingAdminService service(
            AiPostRunRepository runRepository,
            AiPostDraftRepository draftRepository,
            PostService postService
    ) {
        return new AiAutoPostingAdminService(
                mock(AiPostTopicRepository.class),
                runRepository,
                mock(CategoryRepository.class),
                mock(AiAutoPostingService.class),
                mock(AiAutoPostingProperties.class),
                draftRepository,
                postService,
                CLOCK
        );
    }

    private AiPostDraft draft(String topic, LocalDateTime createdAt) {
        return new AiPostDraft(topic, new AiPostGenerateResponse(
                topic + " guide",
                "summary",
                "## " + topic,
                List.of("Security"),
                "8분 읽기",
                List.of("OAuth2"),
                "spring",
                "laptop"
        ), createdAt);
    }
}
