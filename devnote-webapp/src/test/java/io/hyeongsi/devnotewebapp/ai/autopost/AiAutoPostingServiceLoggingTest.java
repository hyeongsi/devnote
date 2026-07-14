package io.hyeongsi.devnotewebapp.ai.autopost;

import io.hyeongsi.devnotewebapp.ai.dto.AiPostGenerateResponse;
import io.hyeongsi.devnotewebapp.category.Category;
import io.hyeongsi.devnotewebapp.errorlog.ErrorLogRecorder;
import io.hyeongsi.devnotewebapp.post.PostDetailResponse;
import io.hyeongsi.devnotewebapp.post.PostRepository;
import io.hyeongsi.devnotewebapp.post.PostService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.concurrent.atomic.AtomicReference;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(OutputCaptureExtension.class)
class AiAutoPostingServiceLoggingTest {

    private static final Clock CLOCK = Clock.fixed(
            Instant.parse("2026-06-23T03:00:00Z"),
            ZoneId.of("Asia/Seoul")
    );

    @Test
    void usesCompactLengthHintForAutomaticGeneration() {
        AiPostTopicRepository topicRepository = mock(AiPostTopicRepository.class);
        AiPostRunRepository runRepository = mock(AiPostRunRepository.class);
        PostService postService = mock(PostService.class);
        PostRepository postRepository = mock(PostRepository.class);
        AiAutoPostingProperties properties = mock(AiAutoPostingProperties.class);
        AiPostTopic topic = topic();
        AtomicReference<io.hyeongsi.devnotewebapp.ai.client.AiPostGenerationContext> capturedContext = new AtomicReference<>();

        when(properties.zone()).thenReturn("Asia/Seoul");
        when(runRepository.existsRunning()).thenReturn(false);
        when(topicRepository.findNextEnabledTopic()).thenReturn(Optional.of(topic));
        when(runRepository.findRecentGeneratedTitles(topic, AiPostRunStatus.SUCCEEDED, 2)).thenReturn(List.of());
        when(runRepository.save(any(AiPostRun.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(postRepository.existsBySlug(any())).thenReturn(false);
        when(postService.createPost(any())).thenReturn(new PostDetailResponse(
                44L, "spring-observability-2026-06-23", "Spring", "spring",
                "Spring observability", "summary", "2026.06.23", "8분 읽기", 0,
                List.of("Spring"), "monitor", "## private generated content"
        ));

        AiAutoPostingService service = new AiAutoPostingService(
                topicRepository,
                runRepository,
                context -> {
                    capturedContext.set(context);
                    return generated();
                },
                postService,
                postRepository,
                mock(ErrorLogRecorder.class),
                properties,
                CLOCK
        );

        service.executeManual();

        assertThat(capturedContext.get()).isNotNull();
        assertThat(capturedContext.get().lengthHint()).isEqualTo("간결하게");
        assertThat(capturedContext.get().singleRequest()).isTrue();
        verify(runRepository).findRecentGeneratedTitles(topic, AiPostRunStatus.SUCCEEDED, 2);
    }

    @Test
    void logsManualRunSuccessWithoutGeneratedContent(CapturedOutput output) {
        AiPostTopicRepository topicRepository = mock(AiPostTopicRepository.class);
        AiPostRunRepository runRepository = mock(AiPostRunRepository.class);
        PostService postService = mock(PostService.class);
        PostRepository postRepository = mock(PostRepository.class);
        AiAutoPostingProperties properties = mock(AiAutoPostingProperties.class);
        AiPostTopic topic = topic();
        ReflectionTestUtils.setField(topic, "id", 3L);
        when(properties.zone()).thenReturn("Asia/Seoul");
        when(runRepository.existsRunning()).thenReturn(false);
        when(topicRepository.findNextEnabledTopic()).thenReturn(Optional.of(topic));
        when(runRepository.findRecentGeneratedTitles(topic, AiPostRunStatus.SUCCEEDED, 2)).thenReturn(List.of());
        when(runRepository.save(any(AiPostRun.class))).thenAnswer(invocation -> {
            AiPostRun run = invocation.getArgument(0);
            if (run.getId() == null) {
                ReflectionTestUtils.setField(run, "id", 12L);
            }
            return run;
        });
        when(postRepository.existsBySlug(any())).thenReturn(false);
        when(postService.createPost(any())).thenReturn(new PostDetailResponse(
                44L, "spring-observability-2026-06-23", "Spring", "spring",
                "Spring observability", "summary", "2026.06.23", "8遺??쎄린", 0,
                List.of("Spring"), "monitor", "## private generated content"
        ));

        AiAutoPostingService service = new AiAutoPostingService(
                topicRepository,
                runRepository,
                context -> generated(),
                postService,
                postRepository,
                mock(ErrorLogRecorder.class),
                properties,
                CLOCK
        );

        service.executeManual();

        assertThat(output).contains("ai-autopost run started");
        assertThat(output).contains("runType=MANUAL");
        assertThat(output).contains("topicId=3");
        assertThat(output).contains("ai-autopost run succeeded");
        assertThat(output).contains("runId=12");
        assertThat(output).contains("postId=44");
        assertThat(output).doesNotContain("private generated content");
    }

    @Test
    void logsRunFailure(CapturedOutput output) {
        AiPostTopicRepository topicRepository = mock(AiPostTopicRepository.class);
        AiPostRunRepository runRepository = mock(AiPostRunRepository.class);
        PostService postService = mock(PostService.class);
        PostRepository postRepository = mock(PostRepository.class);
        AiAutoPostingProperties properties = mock(AiAutoPostingProperties.class);
        ErrorLogRecorder errorLogRecorder = mock(ErrorLogRecorder.class);
        AiPostTopic topic = topic();
        ReflectionTestUtils.setField(topic, "id", 3L);
        when(properties.zone()).thenReturn("Asia/Seoul");
        when(runRepository.existsRunning()).thenReturn(false);
        when(topicRepository.findNextEnabledTopic()).thenReturn(Optional.of(topic));
        when(runRepository.findRecentGeneratedTitles(topic, AiPostRunStatus.SUCCEEDED, 2)).thenReturn(List.of());
        when(runRepository.save(any(AiPostRun.class))).thenAnswer(invocation -> {
            AiPostRun run = invocation.getArgument(0);
            if (run.getId() == null) {
                ReflectionTestUtils.setField(run, "id", 13L);
            }
            return run;
        });

        AiAutoPostingService service = new AiAutoPostingService(
                topicRepository,
                runRepository,
                context -> { throw new IllegalStateException("Gemini returned an incomplete post"); },
                postService,
                postRepository,
                errorLogRecorder,
                properties,
                CLOCK
        );

        service.executeManual();

        assertThat(output).contains("ai-autopost run failed");
        assertThat(output).contains("runId=13");
        assertThat(output).contains("topicId=3");
        assertThat(output).contains("errorType=IllegalStateException");
        verify(errorLogRecorder).recordSystemError(
                eq("MANUAL"),
                eq("/internal/ai-auto-posting/manual"),
                eq(500),
                argThat(exception -> exception instanceof IllegalStateException
                        && "Gemini returned an incomplete post".equals(exception.getMessage())),
                anyLong()
        );
    }

    @Test
    void recordsScheduledRunFailureToErrorLogs() {
        AiPostTopicRepository topicRepository = mock(AiPostTopicRepository.class);
        AiPostRunRepository runRepository = mock(AiPostRunRepository.class);
        PostService postService = mock(PostService.class);
        PostRepository postRepository = mock(PostRepository.class);
        AiAutoPostingProperties properties = mock(AiAutoPostingProperties.class);
        ErrorLogRecorder errorLogRecorder = mock(ErrorLogRecorder.class);
        AiPostTopic topic = topic();

        when(properties.zone()).thenReturn("Asia/Seoul");
        when(runRepository.existsSucceededBetween(any(LocalDateTime.class), any(LocalDateTime.class))).thenReturn(false);
        when(runRepository.existsRunning()).thenReturn(false);
        when(topicRepository.findNextEnabledTopic()).thenReturn(Optional.of(topic));
        when(runRepository.findRecentGeneratedTitles(topic, AiPostRunStatus.SUCCEEDED, 2)).thenReturn(List.of());
        when(runRepository.save(any(AiPostRun.class))).thenAnswer(invocation -> invocation.getArgument(0));

        AiAutoPostingService service = new AiAutoPostingService(
                topicRepository,
                runRepository,
                context -> { throw new IllegalStateException("Gemini generation stopped because finishReason=MAX_TOKENS"); },
                postService,
                postRepository,
                errorLogRecorder,
                properties,
                CLOCK
        );

        service.executeScheduled();

        verify(errorLogRecorder).recordSystemError(
                eq("SCHEDULED"),
                eq("/internal/ai-auto-posting/scheduled"),
                eq(500),
                argThat(exception -> exception instanceof IllegalStateException
                        && "Gemini generation stopped because finishReason=MAX_TOKENS".equals(exception.getMessage())),
                anyLong()
        );
    }

    @Test
    void logsRunSkipWhenAlreadyRunning(CapturedOutput output) {
        AiPostRunRepository runRepository = mock(AiPostRunRepository.class);
        AiAutoPostingProperties properties = mock(AiAutoPostingProperties.class);
        when(properties.zone()).thenReturn("Asia/Seoul");
        when(runRepository.existsRunning()).thenReturn(true);
        when(runRepository.save(any(AiPostRun.class))).thenAnswer(invocation -> invocation.getArgument(0));

        AiAutoPostingService service = new AiAutoPostingService(
                mock(AiPostTopicRepository.class),
                runRepository,
                context -> generated(),
                mock(PostService.class),
                mock(PostRepository.class),
                mock(ErrorLogRecorder.class),
                properties,
                CLOCK
        );

        service.executeManual();

        assertThat(output).contains("ai-autopost run skipped");
        assertThat(output).contains("reason=\"Another automatic posting run is in progress\"");
    }

    private AiPostTopic topic() {
        Category category = new Category("spring", "Spring", "Spring", true, 1);
        ReflectionTestUtils.setField(category, "id", 1L);
        return new AiPostTopic("Spring observability", category, 1, true);
    }

    private AiPostGenerateResponse generated() {
        return new AiPostGenerateResponse(
                "Spring observability",
                "summary",
                "## private generated content",
                List.of("Spring"),
                "8遺??쎄린",
                List.of("logs"),
                "spring",
                "monitor"
        );
    }
}
