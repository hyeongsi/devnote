package io.hyeongsi.devnotewebapp.ai.autopost;

import io.hyeongsi.devnotewebapp.category.Category;
import io.hyeongsi.devnotewebapp.category.CategoryRepository;
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
import java.util.stream.Collectors;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
@Transactional(readOnly = true)
public class AiAutoPostingAdminService {

    private final AiPostTopicRepository topicRepository;
    private final AiPostRunRepository runRepository;
    private final CategoryRepository categoryRepository;
    private final AiAutoPostingService autoPostingService;
    private final AiAutoPostingProperties properties;
    private final Clock clock;

    public AiAutoPostingAdminService(
            AiPostTopicRepository topicRepository,
            AiPostRunRepository runRepository,
            CategoryRepository categoryRepository,
            AiAutoPostingService autoPostingService,
            AiAutoPostingProperties properties,
            Clock clock
    ) {
        this.topicRepository = topicRepository;
        this.runRepository = runRepository;
        this.categoryRepository = categoryRepository;
        this.autoPostingService = autoPostingService;
        this.properties = properties;
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

    public List<AiAutoPostingDtos.RunResponse> runs() {
        return runRepository.findRecentRuns(20).stream().map(this::toRun).toList();
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
}
