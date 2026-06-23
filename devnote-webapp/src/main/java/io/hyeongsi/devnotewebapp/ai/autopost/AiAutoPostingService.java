package io.hyeongsi.devnotewebapp.ai.autopost;

import io.hyeongsi.devnotewebapp.ai.client.AiPostClient;
import io.hyeongsi.devnotewebapp.ai.client.AiPostGenerationContext;
import io.hyeongsi.devnotewebapp.ai.dto.AiPostGenerateResponse;
import io.hyeongsi.devnotewebapp.post.PostCreateRequest;
import io.hyeongsi.devnotewebapp.post.PostDetailResponse;
import io.hyeongsi.devnotewebapp.post.PostRepository;
import io.hyeongsi.devnotewebapp.post.PostService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.text.Normalizer;
import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Locale;

@Service
public class AiAutoPostingService {

    private static final Logger log = LoggerFactory.getLogger(AiAutoPostingService.class);

    private final AiPostTopicRepository topicRepository;
    private final AiPostRunRepository runRepository;
    private final AiPostClient aiPostClient;
    private final PostService postService;
    private final PostRepository postRepository;
    private final AiAutoPostingProperties properties;
    private final Clock clock;

    public AiAutoPostingService(
            AiPostTopicRepository topicRepository,
            AiPostRunRepository runRepository,
            AiPostClient aiPostClient,
            PostService postService,
            PostRepository postRepository,
            AiAutoPostingProperties properties,
            Clock clock
    ) {
        this.topicRepository = topicRepository;
        this.runRepository = runRepository;
        this.aiPostClient = aiPostClient;
        this.postService = postService;
        this.postRepository = postRepository;
        this.properties = properties;
        this.clock = clock;
    }

    public AiPostRun executeScheduled() {
        ZoneId zone = ZoneId.of(properties.zone());
        LocalDate today = LocalDate.now(clock.withZone(zone));
        LocalDateTime start = today.atStartOfDay();
        LocalDateTime end = today.plusDays(1).atStartOfDay();

        if (runRepository.existsSucceededBetween(start, end)) {
            AiPostRun skipped = runRepository.save(
                    AiPostRun.skipped("Today's automatic post is already published", now(zone))
            );
            log.warn("ai-autopost run skipped runType=SCHEDULED reason=\"{}\"", skipped.getErrorMessage());
            return skipped;
        }
        return execute(false);
    }

    public AiPostRun executeManual() {
        return execute(true);
    }

    private AiPostRun execute(boolean manual) {
        ZoneId zone = ZoneId.of(properties.zone());
        LocalDateTime now = now(zone);
        String runType = manual ? "MANUAL" : "SCHEDULED";
        if (runRepository.existsRunning()) {
            AiPostRun skipped = runRepository.save(AiPostRun.skipped("Another automatic posting run is in progress", now));
            log.warn("ai-autopost run skipped runType={} reason=\"{}\"", runType, skipped.getErrorMessage());
            return skipped;
        }

        AiPostTopic topic = topicRepository.findNextEnabledTopic()
                .orElse(null);
        if (topic == null) {
            AiPostRun skipped = runRepository.save(AiPostRun.skipped("No enabled AI posting topics", now));
            log.warn("ai-autopost run skipped runType={} reason=\"{}\"", runType, skipped.getErrorMessage());
            return skipped;
        }

        long startedAt = System.nanoTime();
        AiPostRun run = runRepository.save(new AiPostRun(topic, now));
        log.info(
                "ai-autopost run started runType={} runId={} topicId={} topic=\"{}\"",
                runType,
                run.getId(),
                topic.getId(),
                topic.getName()
        );
        try {
            List<String> recentTitles = runRepository.findRecentGeneratedTitles(
                    topic,
                    AiPostRunStatus.SUCCEEDED,
                    5
            );
            AiPostGenerateResponse generated = aiPostClient.generate(new AiPostGenerationContext(
                    topic.getName(),
                    "실무에서 바로 활용할 수 있는 학습형 글",
                    List.of(),
                    List.of(),
                    "초급도 이해할 수 있게",
                    "자세히",
                    topic.getCategory().getSlug(),
                    recentTitles
            ));
            validate(generated);
            String slug = uniqueSlug(generated.title(), topic.getName(), LocalDate.now(clock.withZone(zone)));
            PostDetailResponse post = postService.createPost(new PostCreateRequest(
                    slug,
                    topic.getCategory().getId(),
                    generated.title(),
                    generated.summary(),
                    generated.readTime(),
                    generated.thumbnailStyle(),
                    generated.content(),
                    generated.tags()
            ));
            LocalDateTime completedAt = now(zone);
            run.succeed(post.id(), generated.title(), completedAt);
            topic.markSucceeded(completedAt);
            topicRepository.save(topic);
            AiPostRun saved = runRepository.save(run);
            log.info(
                    "ai-autopost run succeeded runType={} runId={} topicId={} postId={} title=\"{}\" durationMs={}",
                    runType,
                    saved.getId(),
                    topic.getId(),
                    post.id(),
                    generated.title(),
                    elapsedMillis(startedAt)
            );
            return saved;
        } catch (RuntimeException exception) {
            run.fail(safeMessage(exception), now(zone));
            AiPostRun saved = runRepository.save(run);
            log.error(
                    "ai-autopost run failed runType={} runId={} topicId={} errorType={} message=\"{}\" durationMs={}",
                    runType,
                    saved.getId(),
                    topic.getId(),
                    exception.getClass().getSimpleName(),
                    safeMessage(exception),
                    elapsedMillis(startedAt)
            );
            return saved;
        }
    }

    private LocalDateTime now(ZoneId zone) {
        return LocalDateTime.now(clock.withZone(zone));
    }

    private void validate(AiPostGenerateResponse response) {
        if (response == null || isBlank(response.title()) || isBlank(response.summary())
                || isBlank(response.content()) || isBlank(response.readTime())
                || isBlank(response.thumbnailStyle()) || response.tags() == null || response.tags().isEmpty()) {
            throw new IllegalStateException("Gemini returned an incomplete post");
        }
    }

    private String uniqueSlug(String title, String fallback, LocalDate date) {
        String base = slugify(title);
        if (base.isBlank()) {
            base = slugify(fallback);
        }
        if (base.isBlank()) {
            base = "ai-post";
        }
        String candidate = base + "-" + date;
        int suffix = 2;
        while (postRepository.existsBySlug(candidate)) {
            candidate = base + "-" + date + "-" + suffix++;
        }
        return candidate;
    }

    private String slugify(String value) {
        return Normalizer.normalize(value, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("(^-|-$)", "");
    }

    private String safeMessage(RuntimeException exception) {
        String message = exception.getMessage();
        return message == null || message.isBlank() ? exception.getClass().getSimpleName() : message;
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private long elapsedMillis(long startedAt) {
        return (System.nanoTime() - startedAt) / 1_000_000L;
    }
}
