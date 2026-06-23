package io.hyeongsi.devnotewebapp.ai.autopost;

import io.hyeongsi.devnotewebapp.ai.draft.AiPostDraft;
import io.hyeongsi.devnotewebapp.ai.draft.AiPostDraftDtos;
import io.hyeongsi.devnotewebapp.ai.draft.AiPostDraftRepository;
import io.hyeongsi.devnotewebapp.ai.draft.AiPostDraftStatus;
import io.hyeongsi.devnotewebapp.category.Category;
import io.hyeongsi.devnotewebapp.category.CategoryRepository;
import io.hyeongsi.devnotewebapp.post.PostDetailResponse;
import io.hyeongsi.devnotewebapp.post.PostService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;
import java.util.stream.Stream;
import java.util.stream.Collectors;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.CONFLICT;
import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
@Transactional(readOnly = true)
public class AiAutoPostingAdminService {

    private static final Logger log = LoggerFactory.getLogger(AiAutoPostingAdminService.class);

    private final AiPostTopicRepository topicRepository;
    private final AiPostRunRepository runRepository;
    private final CategoryRepository categoryRepository;
    private final AiAutoPostingService autoPostingService;
    private final AiAutoPostingProperties properties;
    private final AiPostDraftRepository draftRepository;
    private final PostService postService;
    private final Clock clock;

    public AiAutoPostingAdminService(
            AiPostTopicRepository topicRepository,
            AiPostRunRepository runRepository,
            CategoryRepository categoryRepository,
            AiAutoPostingService autoPostingService,
            AiAutoPostingProperties properties,
            AiPostDraftRepository draftRepository,
            PostService postService,
            Clock clock
    ) {
        this.topicRepository = topicRepository;
        this.runRepository = runRepository;
        this.categoryRepository = categoryRepository;
        this.autoPostingService = autoPostingService;
        this.properties = properties;
        this.draftRepository = draftRepository;
        this.postService = postService;
        this.clock = clock;
    }

    public AiAutoPostingDtos.StatusResponse status() {
        AiPostTopic next = topicRepository.findNextEnabledTopic()
                .orElse(null);
        ZoneId zone = ZoneId.of(properties.zone());
        LocalDate today = LocalDate.now(clock.withZone(zone));
        LocalDateTime candidate = LocalDateTime.of(today, LocalTime.of(6, 0));
        if (!candidate.isAfter(LocalDateTime.now(clock.withZone(zone)))) {
            candidate = candidate.plusDays(1);
        }
        return new AiAutoPostingDtos.StatusResponse(
                properties.enabled(),
                properties.geminiConfigured(),
                properties.model(),
                properties.zone(),
                properties.cron(),
                candidate,
                next == null ? null : toTopic(next)
        );
    }

    public List<AiAutoPostingDtos.TopicResponse> topics() {
        return topicRepository.findAllOrdered().stream()
                .map(this::toTopic)
                .toList();
    }

    @Transactional
    public AiAutoPostingDtos.TopicResponse create(AiAutoPostingDtos.TopicRequest request) {
        validate(request);
        Category category = category(request.categoryId());
        int order = request.displayOrder() == null ? (int) topicRepository.count() + 1 : request.displayOrder();
        return toTopic(topicRepository.save(new AiPostTopic(
                request.name().trim(), category, order, request.enabled() == null || request.enabled()
        )));
    }

    @Transactional
    public AiAutoPostingDtos.TopicResponse update(Long id, AiAutoPostingDtos.TopicRequest request) {
        validate(request);
        AiPostTopic topic = findTopic(id);
        topic.update(
                request.name().trim(),
                category(request.categoryId()),
                request.displayOrder() == null ? topic.getDisplayOrder() : request.displayOrder(),
                request.enabled() == null ? topic.getEnabled() : request.enabled()
        );
        return toTopic(topic);
    }

    @Transactional
    public void disable(Long id) {
        AiPostTopic topic = findTopic(id);
        topic.update(topic.getName(), topic.getCategory(), topic.getDisplayOrder(), false);
    }

    @Transactional
    public void reorder(AiAutoPostingDtos.OrderRequest request) {
        if (request == null || request.topicIds() == null) {
            throw new ResponseStatusException(BAD_REQUEST, "Topic order is required");
        }
        Map<Long, AiPostTopic> topics = topicRepository.findAllById(request.topicIds()).stream()
                .collect(Collectors.toMap(AiPostTopic::getId, topic -> topic));
        for (int index = 0; index < request.topicIds().size(); index++) {
            AiPostTopic topic = topics.get(request.topicIds().get(index));
            if (topic != null) {
                topic.update(topic.getName(), topic.getCategory(), index + 1, topic.getEnabled());
            }
        }
    }

    public List<AiPostDraftDtos.HistoryItem> runs() {
        Stream<AiPostDraftDtos.HistoryItem> automaticRuns = runRepository.findRecentRuns(20).stream()
                .map(this::toHistoryItem);
        Stream<AiPostDraftDtos.HistoryItem> drafts = draftRepository
                .findAllByOrderByCreatedAtDescIdDesc(PageRequest.of(0, 20))
                .stream()
                .map(this::toHistoryItem);

        return Stream.concat(automaticRuns, drafts)
                .sorted((left, right) -> right.occurredAt().compareTo(left.occurredAt()))
                .limit(20)
                .toList();
    }

    public AiPostDraftDtos.DraftDetail draft(Long id) {
        AiPostDraft draft = loadableDraft(id);
        log.info("ai-draft load succeeded draftId={} topic=\"{}\"", draft.getId(), draft.getTopic());
        return toDraftDetail(draft);
    }

    @Transactional
    public PostDetailResponse publishDraft(Long id, AiPostDraftDtos.PublishDraftRequest request) {
        if (request == null || request.post() == null) {
            throw new ResponseStatusException(BAD_REQUEST, "Post request is required");
        }
        AiPostDraft draft = loadableDraft(id);
        PostDetailResponse post = postService.createPost(request.post());
        draft.publish(post.id(), LocalDateTime.now(clock));
        log.info(
                "ai-draft publish succeeded draftId={} postId={} topic=\"{}\"",
                draft.getId(),
                post.id(),
                draft.getTopic()
        );
        return post;
    }

    public AiAutoPostingDtos.RunResponse runNow() {
        return toRun(autoPostingService.executeManual());
    }

    private void validate(AiAutoPostingDtos.TopicRequest request) {
        if (request == null || request.name() == null || request.name().isBlank() || request.categoryId() == null) {
            throw new ResponseStatusException(BAD_REQUEST, "Topic name and category are required");
        }
    }

    private Category category(Long id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Category not found"));
    }

    private AiPostTopic findTopic(Long id) {
        return topicRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "AI posting topic not found"));
    }

    private AiAutoPostingDtos.TopicResponse toTopic(AiPostTopic topic) {
        return new AiAutoPostingDtos.TopicResponse(
                topic.getId(),
                topic.getName(),
                topic.getCategory().getId(),
                topic.getCategory().getName(),
                topic.getEnabled(),
                topic.getDisplayOrder(),
                topic.getLastSucceededAt()
        );
    }

    private AiAutoPostingDtos.RunResponse toRun(AiPostRun run) {
        return new AiAutoPostingDtos.RunResponse(
                run.getId(),
                run.getTopic() == null ? null : run.getTopic().getId(),
                run.getTopic() == null ? null : run.getTopic().getName(),
                run.getPostId(),
                run.getStatus(),
                run.getGeneratedTitle(),
                run.getErrorMessage(),
                run.getStartedAt(),
                run.getCompletedAt()
        );
    }

    private AiPostDraft loadableDraft(Long id) {
        AiPostDraft draft = draftRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "AI post draft not found"));
        if (draft.getStatus() != AiPostDraftStatus.DRAFT) {
            throw new ResponseStatusException(CONFLICT, "AI post draft is already published");
        }
        return draft;
    }

    private AiPostDraftDtos.DraftDetail toDraftDetail(AiPostDraft draft) {
        return new AiPostDraftDtos.DraftDetail(
                draft.getId(),
                draft.getTopic(),
                draft.getTitle(),
                draft.getSummary(),
                draft.getContent(),
                draft.getTags(),
                draft.getReadTime(),
                draft.getRecommendedTopics(),
                draft.getRecommendedCategorySlug(),
                draft.getThumbnailStyle()
        );
    }

    private AiPostDraftDtos.HistoryItem toHistoryItem(AiPostDraft draft) {
        return new AiPostDraftDtos.HistoryItem(
                "draft-" + draft.getId(),
                draft.getId(),
                draft.getTopic(),
                draft.getStatus().name(),
                draft.getStatus() == AiPostDraftStatus.DRAFT,
                draft.getCreatedAt(),
                null
        );
    }

    private AiPostDraftDtos.HistoryItem toHistoryItem(AiPostRun run) {
        return new AiPostDraftDtos.HistoryItem(
                "run-" + run.getId(),
                null,
                run.getTopic() == null ? run.getStatus().name() : run.getTopic().getName(),
                run.getStatus().name(),
                false,
                run.getStartedAt(),
                run.getErrorMessage()
        );
    }
}
